import { FastifyError } from "@fastify/error";
import { requestContext } from "@fastify/request-context";
import { HTTPServiceName } from "@knodia/common-models/services";
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
import { serviceErrorCode } from "../models/errors/services.ts";

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

type MakeProblemFn<T extends string> = (
  e: ApiError<CommonErrorCodes | T>,
) => API_Problem;

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

interface ResolvedApiProblem {
  apiProblem: API_Problem;
  logLevel: "error" | "warn";
  logString: string;
  shouldForceGenericProblem?: boolean;
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

    const { apiProblem, logLevel, logString, shouldForceGenericProblem } =
      resolveApiProblem<T>({
        error,
        genericProblem,
        makeProblem,
        problemErrorsPassthrough,
      });

    if (forceGenericProblemOn500 && shouldForceGenericProblem) {
      logger[logLevel](
        `${logString}. forceGenericProblemOn500 is set to true, returning generic problem`,
      );
      return genericProblem;
    }

    logger[logLevel](logString);

    return apiProblem;
  };
}

function resolveApiProblem<T extends string>(params: {
  error: unknown;
  genericProblem: API_Problem;
  makeProblem: MakeProblemFn<T>;
  problemErrorsPassthrough: boolean;
}): ResolvedApiProblem {
  const { error, genericProblem, makeProblem, problemErrorsPassthrough } =
    params;

  return match<unknown, ResolvedApiProblem>(error)
    .with(
      P.when((e) => hasZodFastifySchemaValidationErrors(e)),
      (e) => {
        const apiProblem = makeProblem(zodFastifySchemaValidationError(e));
        const problemLogString = makeProblemLogString(apiProblem, e);
        return {
          apiProblem,
          logLevel: "warn",
          logString: problemLogString,
        };
      },
    )
    .with(
      P.when((e) => isResponseSerializationError(e)),
      (e) => {
        const apiProblem = makeProblem(responseSerializationError(e));
        const problemLogString = makeProblemLogString(apiProblem, e);
        return {
          apiProblem,
          logLevel: "warn",
          logString: problemLogString,
        };
      },
    )
    .with(P.instanceOf(ApiError<CommonErrorCodes | T>), (e) => {
      const apiProblem = makeProblem(e);
      const problemLogString = makeProblemLogString(apiProblem, e);
      return {
        apiProblem,
        logLevel: "warn",
        logString: problemLogString,
        shouldForceGenericProblem:
          e.status === HTTP_STATUS_INTERNAL_SERVER_ERROR,
      };
    })
    .with(P.instanceOf(FastifyError), (e) => {
      const httpStatus = e.statusCode ?? HTTP_STATUS_INTERNAL_SERVER_ERROR;

      const apiProblem = makeProblem(fastifyError(httpStatus, e.message));
      const problemLogString = makeProblemLogString(apiProblem, e);

      return {
        apiProblem,
        logLevel: "warn",
        logString: problemLogString,
        shouldForceGenericProblem:
          httpStatus === HTTP_STATUS_INTERNAL_SERVER_ERROR,
      };
    })
    .with(
      /* this case is to allow a passthrough of API_Problem errors, so that
           services that call other interop services can forward API_Problem errors
           as they are, without the need to explicitly handle them */
      P.when((e) => isPassThroughError(e)),
      (e) => {
        const receivedProblem: API_Problem = e.response.data;
        if (problemErrorsPassthrough) {
          return {
            apiProblem: receivedProblem,
            logLevel: "warn",
            logString: makeProblemLogString(receivedProblem, e),
            shouldForceGenericProblem:
              e.response.status === HTTP_STATUS_INTERNAL_SERVER_ERROR ||
              receivedProblem.status === HTTP_STATUS_INTERNAL_SERVER_ERROR,
          };
        }

        return {
          apiProblem: genericProblem,
          logLevel: "warn",
          logString: makeProblemLogString(
            genericProblem,
            `${receivedProblem.title} - status ${receivedProblem.status}`,
          ),
        };
      },
    )
    .with(P.instanceOf(ZodError), (e) =>
      // Zod errors shall always be caught and handled throwing
      // an ApiError. If a ZodError arrives here we log it and
      // return a generic problem
      ({
        apiProblem: genericProblem,
        logLevel: "error",
        logString: makeProblemLogString(genericProblem, fromZodError(e)),
      }),
    )
    .otherwise((e: unknown) => ({
      apiProblem: genericProblem,
      logLevel: "error",
      logString: makeProblemLogString(genericProblem, e),
    }));
}

function retrieveServiceErrorCode(serviceName: string): string {
  return HTTPServiceName.transform(
    (serviceName) => serviceErrorCode[serviceName],
  )
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
