import { FastifyError } from "@fastify/error";
import { requestContext } from "@fastify/request-context";
import { type AxiosError, isAxiosError } from "axios";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from "fastify-type-provider-zod";
import { constants } from "http2";
import { match, P } from "ts-pattern";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

import type { API_Problem } from "../models/api.ts";

import { getContextValues } from "../context/context.ts";
import { ApiError } from "../models/errors/apiError.ts";
import {
  commonErrorCodes,
  type CommonErrorCodes,
  fastifyError,
  genericError,
  responseSerializationError,
  zodFastifySchemaValidationError,
} from "../models/errors/errors.ts";
import { serviceErrorCode, ServiceName } from "../models/errors/services.ts";

const { HTTP_STATUS_INTERNAL_SERVER_ERROR } = constants;

type MakeApiProblemFn = (error: unknown) => API_Problem;

const makeProblemLogString = (
  problem: API_Problem,
  originalError: unknown,
): string => {
  const errorsString = problem.errors?.map((e) => e.detail).join(" - ");
  return `- title: ${problem.title} - code: ${problem.code} - ${errorsString ? `errors: ${errorsString} - ` : ""}
  original error: ${originalError}`;
};

interface ProblemBuilderOptions {
  /**
   * If true, return a generic problem whenever an error status code is HTTP 500, hiding the underlying error info.
   * This also applies to 500 errors passing through from downstream services.
   *
   * @default false
   */
  forceGenericProblemOn500?: boolean;
  /**
   * If true, allows API_Problem objects received from downstream services
   * to be passed through directly. If false, they are treated as generic errors.
   *
   * @default true
   */
  problemErrorsPassthrough?: boolean;
}

export function makeApiProblemBuilder<T extends string>(
  errors: Record<T, string>,
  options: ProblemBuilderOptions = {},
): MakeApiProblemFn {
  const { forceGenericProblemOn500 = false, problemErrorsPassthrough = true } =
    options;
  const allErrors = { ...commonErrorCodes, ...errors };

  function retrieveServiceErrorCode(serviceName: string): string {
    const serviceNameParsed = ServiceName.safeParse(serviceName);
    return serviceNameParsed.success
      ? serviceErrorCode[serviceNameParsed.data]
      : "000";
  }

  return (error) => {
    const { correlationId, logger, serviceName } =
      getContextValues(requestContext);
    const serviceErrorCode = retrieveServiceErrorCode(serviceName);

    const makeProblem = ({
      code,
      errors,
      status,
      title,
    }: ApiError<CommonErrorCodes | T>): API_Problem => ({
      code: `${serviceErrorCode}-${allErrors[code]}`,
      correlationId,
      errors,
      status,
      title,
    });

    const genericProblem = makeProblem(genericError("Unexpected error"));

    return match<unknown, API_Problem>(error)
      .with(
        P.when((e) => hasZodFastifySchemaValidationErrors(e)),
        (e) => {
          const problem = makeProblem(zodFastifySchemaValidationError(e));
          const problemLogString = makeProblemLogString(problem, e);

          logger.warn(problemLogString);
          return problem;
        },
      )
      .with(
        P.when((e) => isResponseSerializationError(e)),
        (e) => {
          const problem = makeProblem(responseSerializationError(e));
          const problemLogString = makeProblemLogString(problem, e);

          logger.warn(problemLogString);
          return problem;
        },
      )
      .with(P.instanceOf(ApiError<CommonErrorCodes | T>), (e) => {
        const isInternalServerError =
          e.status === HTTP_STATUS_INTERNAL_SERVER_ERROR;

        const problem = makeProblem(e);
        const problemLogString = makeProblemLogString(problem, e);

        if (forceGenericProblemOn500 && isInternalServerError) {
          logger.warn(
            `${problemLogString}. forceGenericProblemOn500 is set to true, returning generic problem`,
          );
          return genericProblem;
        }

        logger.warn(problemLogString);
        return problem;
      })
      .with(P.instanceOf(FastifyError), (e) => {
        const httpStatus = e.statusCode ?? HTTP_STATUS_INTERNAL_SERVER_ERROR;

        const problem = makeProblem(fastifyError(httpStatus, e.message));
        const problemLogString = makeProblemLogString(problem, e);

        if (
          forceGenericProblemOn500 &&
          httpStatus === HTTP_STATUS_INTERNAL_SERVER_ERROR
        ) {
          logger.warn(
            `${problemLogString}. forceGenericProblemOn500 is set to true, returning generic problem`,
          );
          return genericProblem;
        }

        logger.warn(problemLogString);
        return problem;
      })
      .with(
        /* this case is to allow a passthrough of API_Problem errors, so that
           services that call other interop services can forward API_Problem errors
           as they are, without the need to explicitly handle them */
        P.intersection(
          P.when((e): e is AxiosError<API_Problem> => isAxiosError(e)),
          {
            response: {
              data: {
                code: P.string,
                errors: P.array({
                  detail: P.string,
                }),
                status: P.number,
                title: P.string,
              },
              // Also matching AxiosError content to ensure data matches API_Problem type
              status: P.number,
            },
          },
        ),
        (e) => {
          const receivedProblem: API_Problem = e.response.data;
          if (problemErrorsPassthrough) {
            const problemLogString = makeProblemLogString(receivedProblem, e);

            if (
              forceGenericProblemOn500 &&
              (e.response.status === HTTP_STATUS_INTERNAL_SERVER_ERROR ||
                receivedProblem.status === HTTP_STATUS_INTERNAL_SERVER_ERROR)
            ) {
              logger.warn(
                `${problemLogString}. forceGenericProblemOn500 is set to true, returning generic problem`,
              );
              return genericProblem;
            }

            logger.warn(problemLogString);
            return receivedProblem;
          } else {
            logger.warn(
              makeProblemLogString(
                genericProblem,
                `${receivedProblem.title} (code ${receivedProblem.code})`,
              ),
            );
            return genericProblem;
          }
        },
      )
      .with(P.instanceOf(ZodError), (e) => {
        // Zod errors shall always be caught and handled throwing
        // an ApiError. If a ZodError arrives here we log it and
        // return a generic problem
        const zodError = fromZodError(e);
        logger.error(makeProblemLogString(genericProblem, zodError));
        return genericProblem;
      })
      .otherwise((e: unknown): API_Problem => {
        logger.error(makeProblemLogString(genericProblem, e));
        return genericProblem;
      });
  };
}
