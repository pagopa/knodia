/* eslint-disable max-lines-per-function */
import { FastifyError } from "@fastify/error";
import { AxiosError, isAxiosError } from "axios";
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from "fastify-type-provider-zod";
import { STATUS_CODES } from "http";
import { constants } from "http2";
import { match, P } from "ts-pattern";
import z, { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

import { serviceErrorCode, ServiceName } from "./services.ts";

const { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_INTERNAL_SERVER_ERROR } =
  constants;

export const emptyErrorMapper = (): number => HTTP_STATUS_INTERNAL_SERVER_ERROR;

const ProblemError = z
  .strictObject({
    code: z.string(),
    detail: z.string(),
  })
  .meta({ id: "ProblemError" });

export const Problem = z
  .strictObject({
    correlationId: z.string(),
    detail: z.string(),
    errors: z.array(ProblemError),
    status: z.number(),
    title: z.string(),
    type: z.string(),
  })
  .meta({ id: "Problem" });
export type Problem = z.infer<typeof Problem>;

type MakeApiProblemFn<T extends string> = (
  error: unknown,
  httpMapper: (apiError: ApiError<CommonErrorCodes | T>) => number,
  context: {
    // TODO: CorrelationId type
    correlationId: string;
    logger: {
      error: (message: string) => void;
      warn: (message: string) => void;
    };
    serviceName: string;
  },
  operationalLogMessage?: string,
) => Problem;

export class ApiError<T> extends Error {
  public code: T;
  public detail: string;
  public errors: { code: T; detail: string }[];
  public title: string;

  constructor({
    code,
    detail,
    errors,
    title,
  }: {
    code: T;
    detail: string;
    errors?: Error[];
    title: string;
  }) {
    super(detail);
    this.code = code;
    this.title = title;
    this.detail = detail;
    this.errors =
      errors && errors.length > 0
        ? errors.map((e) => ({ code, detail: e.message }))
        : [{ code, detail }];
  }
}

export function createApiError<T>(code: T, detail: string, title: string) {
  return new ApiError({
    code,
    detail,
    title,
  });
}

const makeProblemLogString = (
  problem: Problem,
  originalError: unknown,
): string => {
  const errorsString = problem.errors.map((e) => e.detail).join(" - ");
  return `- title: ${problem.title} - detail: ${problem.detail} - errors: ${errorsString} - original error: ${originalError}`;
};

interface ProblemBuilderOptions {
  /**
   * If true, return a generic problem whenever an error is mapped to HTTP 500, hiding the underlying error info.
   * This also applies to 500 errors passing through from downstream services.
   *
   * @default false
   */
  forceGenericProblemOn500?: boolean;
  /**
   * If true, allows Problem objects received from downstream services
   * to be passed through directly. If false, they are treated as generic errors.
   *
   * @default true
   */
  problemErrorsPassthrough?: boolean;
}

export function makeApiProblemBuilder<T extends string>(
  errors: Record<T, string>,
  options: ProblemBuilderOptions = {},
): MakeApiProblemFn<T> {
  const { forceGenericProblemOn500 = false, problemErrorsPassthrough = true } =
    options;
  const allErrors = { ...commonErrorCodes, ...errors };

  function retrieveServiceErrorCode(serviceName: string): string {
    const serviceNameParsed = ServiceName.safeParse(serviceName);
    return serviceNameParsed.success
      ? serviceErrorCode[serviceNameParsed.data]
      : "000";
  }

  return (
    error,
    httpMapper,
    { correlationId, logger, serviceName },
    operationalLogMessage,
  ) => {
    const serviceErrorCode = retrieveServiceErrorCode(serviceName);

    const makeProblem = (
      httpStatus: number,
      apiError: ApiError<CommonErrorCodes | T> | FastifyError,
    ): Problem => {
      const { detail, errors, title } =
        apiError instanceof ApiError
          ? {
              detail: apiError.detail,
              errors: [
                {
                  code: `${serviceErrorCode}-${allErrors[apiError.code]}`,
                  detail: apiError.detail,
                },
              ],
              title: apiError.title,
            }
          : hasZodFastifySchemaValidationErrors(apiError)
            ? {
                detail: "Request doesn't match the schema",
                errors: apiError.validation.map((validationError) => ({
                  code: `${serviceErrorCode}-${allErrors.zodFastifySchemaValidationError}`,
                  detail: validationError.message,
                })),
                title: "Response Validation Error",
              }
            : isResponseSerializationError(apiError)
              ? {
                  detail: "Response doesn't match the schema",
                  errors: apiError.cause.issues.map((issue) => ({
                    code: `${serviceErrorCode}-${allErrors.responseSerializationError}`,
                    detail: issue.message || "Serialization error",
                  })),

                  title: "Response Serialization Error",
                }
              : {
                  detail: STATUS_CODES[httpStatus] ?? "Unknown Error",
                  errors: [
                    {
                      code: `${serviceErrorCode}-0000`,
                      detail: apiError.message,
                    },
                  ],
                  title: "Fastify Error",
                };

      return {
        correlationId,
        detail,
        errors,
        status: httpStatus,
        title,
        type: "about:blank",
      };
    };

    const genericProblem = makeProblem(
      HTTP_STATUS_INTERNAL_SERVER_ERROR,
      genericError("Unexpected error"),
    );

    if (operationalLogMessage) {
      logger.warn(operationalLogMessage);
    }

    return match<unknown, Problem>(error)
      .with(
        P.when((e) => hasZodFastifySchemaValidationErrors(e)),
        (e) => {
          const problem = makeProblem(HTTP_STATUS_BAD_REQUEST, e);
          const problemLogString = makeProblemLogString(problem, e);

          logger.warn(problemLogString);
          return problem;
        },
      )
      .with(
        P.when((e) => isResponseSerializationError(e)),
        (e) => {
          const problem = makeProblem(HTTP_STATUS_INTERNAL_SERVER_ERROR, e);
          const problemLogString = makeProblemLogString(problem, e);

          logger.warn(problemLogString);
          return problem;
        },
      )
      .with(P.instanceOf(ApiError<CommonErrorCodes | T>), (error) => {
        const mappedCode = httpMapper(error);
        const code =
          mappedCode === HTTP_STATUS_INTERNAL_SERVER_ERROR
            ? defaultCommonErrorMapper(error.code as CommonErrorCodes)
            : mappedCode;

        const isInternalServerError =
          code === HTTP_STATUS_INTERNAL_SERVER_ERROR;

        const problem = makeProblem(code, error);
        const problemLogString = makeProblemLogString(problem, error);

        if (forceGenericProblemOn500 && isInternalServerError) {
          logger.warn(
            `${problemLogString}. forceGenericProblemOn500 is set to true, returning generic problem`,
          );
          return genericProblem;
        }

        logger.warn(problemLogString);
        return problem;
      })
      .with(P.instanceOf(FastifyError), (error) => {
        const httpStatus =
          error.statusCode ?? HTTP_STATUS_INTERNAL_SERVER_ERROR;

        const problem = makeProblem(httpStatus, error);
        const problemLogString = makeProblemLogString(problem, error);

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
        /* this case is to allow a passthrough of Problem errors, so that
           services that call other interop services can forward Problem errors
           as they are, without the need to explicitly handle them */
        P.intersection(
          P.when((e): e is AxiosError<Problem> => isAxiosError(e)),
          {
            response: {
              data: {
                correlationId: P.string.optional(),
                detail: P.string,
                errors: P.array({
                  code: P.string,
                  detail: P.string,
                }),
                status: P.number,
                title: P.string,
                type: "about:blank",
              },
              // Also matching AxiosError content to ensure data matches Problem type
              status: P.number,
            },
          },
        ),
        (e) => {
          const receivedProblem: Problem = e.response.data;
          if (problemErrorsPassthrough) {
            const problemLogString = makeProblemLogString(
              receivedProblem,
              error,
            );

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
                `${receivedProblem.title}, code ${
                  receivedProblem.errors.at(0)?.code
                }, ${receivedProblem.errors.at(0)?.detail}`,
              ),
            );
            return genericProblem;
          }
        },
      )
      .with(P.instanceOf(ZodError), (error) => {
        // Zod errors shall always be caught and handled throwing
        // an ApiError. If a ZodError arrives here we log it and
        // return a generic problem
        const zodError = fromZodError(error);
        logger.error(makeProblemLogString(genericProblem, zodError));
        return genericProblem;
      })
      .otherwise((error: unknown): Problem => {
        logger.error(makeProblemLogString(genericProblem, error));
        return genericProblem;
      });
  };
}

export const commonErrorCodes = {
  genericError: "9991",
  responseSerializationError: "9993",
  zodFastifySchemaValidationError: "9992",
} as const;

export type CommonErrorCodes = keyof typeof commonErrorCodes;

/* ===== API Error ===== */

const defaultCommonErrorMapper = (code: CommonErrorCodes): number =>
  match(code).otherwise(() => HTTP_STATUS_INTERNAL_SERVER_ERROR);

export function genericError(details: string): ApiError<CommonErrorCodes> {
  return createApiError("genericError", details, "Unexpected Error");
}
