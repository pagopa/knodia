import { FastifyError } from "@fastify/error";
import { requestContext } from "@fastify/request-context";
import { type AxiosError, isAxiosError } from "axios";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from "fastify-type-provider-zod";
import { constants } from "http2";
import { match, P } from "ts-pattern";
import z, { ZodError } from "zod";
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

export type MakeApiProblemFn = (error: unknown) => API_Problem;

const makeProblemLogString = (
  problem: API_Problem,
  originalError: unknown,
): string => {
  const errorsString = problem.errors
    ? `- errors: ${problem.errors.map((e) => `${e.code}, ${e.detail}`).join("; ")}`
    : "";
  return `- title: ${problem.title} ${errorsString} - original error: ${originalError}`;
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

  return (error) => {
    const { correlationId, logger, serviceName } =
      getContextValues(requestContext);
    const serviceErrorCode = retrieveServiceErrorCode(serviceName);

    const makeProblem = ({
      errors,
      status,
      title,
    }: ApiError<CommonErrorCodes | T>): API_Problem => ({
      correlationId,
      errors: errors.map(({ code, detail }) => ({
        code: `${serviceErrorCode}-${allErrors[code]}`,
        detail,
      })),
      status,
      title,
    });

    const genericProblem = makeProblem(genericError("Unexpected error"));

    function maybeForceGenericProblem({
      originalError,
      problem,
      shouldForce,
    }: {
      originalError: unknown;
      problem: API_Problem;
      shouldForce: boolean;
    }): API_Problem {
      const problemLogString = makeProblemLogString(problem, originalError);

      if (forceGenericProblemOn500 && shouldForce) {
        logger.warn(
          `${problemLogString}. forceGenericProblemOn500 is set to true, returning generic problem`,
        );
        return genericProblem;
      }

      logger.warn(problemLogString);
      return problem;
    }

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
        const problem = makeProblem(e);
        return maybeForceGenericProblem({
          originalError: e,
          problem,
          shouldForce: e.status === HTTP_STATUS_INTERNAL_SERVER_ERROR,
        });
      })
      .with(P.instanceOf(FastifyError), (e) => {
        const httpStatus = e.statusCode ?? HTTP_STATUS_INTERNAL_SERVER_ERROR;

        const problem = makeProblem(fastifyError(httpStatus, e.message));
        return maybeForceGenericProblem({
          originalError: e,
          problem,
          shouldForce: httpStatus === HTTP_STATUS_INTERNAL_SERVER_ERROR,
        });
      })
      .with(
        /* this case is to allow a passthrough of API_Problem errors, so that
           services that call other interop services can forward API_Problem errors
           as they are, without the need to explicitly handle them */
        P.when((e) => isPassThroughError(e)),
        (e) => {
          const receivedProblem: API_Problem = e.response.data;
          if (problemErrorsPassthrough) {
            return maybeForceGenericProblem({
              originalError: e,
              problem: receivedProblem,
              shouldForce:
                e.response.status === HTTP_STATUS_INTERNAL_SERVER_ERROR ||
                receivedProblem.status === HTTP_STATUS_INTERNAL_SERVER_ERROR,
            });
          }

          logger.warn(
            makeProblemLogString(
              genericProblem,
              `${receivedProblem.title} - status ${receivedProblem.status}`,
            ),
          );

          return genericProblem;
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

function retrieveServiceErrorCode(serviceName: string): string {
  return ServiceName.transform((serviceName) => serviceErrorCode[serviceName])
    .catch("000")
    .parse(serviceName);
}

const problemSchema = z.object({
  response: z.object({
    data: z.object({
      correlationId: z.string().optional(),
      errors: z.array(
        z.object({
          code: z.string(),
          detail: z.string(),
        }),
      ),
      status: z.number(),
      title: z.string(),
    }),
    status: z.number(),
  }),
});

function isPassThroughError(
  error: unknown,
): error is AxiosError<API_Problem> & z.infer<typeof problemSchema> {
  return isAxiosError(error) && problemSchema.safeParse(error).success;
}
