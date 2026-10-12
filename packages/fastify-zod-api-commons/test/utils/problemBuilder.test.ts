import type { RequestContextData } from "@fastify/request-context";
import type { ZodIssue } from "zod-validation-error";

import createError from "@fastify/error";
import { type CorrelationId, generateId } from "@knodia/common-models/ids";
import { DrizzleQueryError } from "drizzle-orm/errors";
import * as zodFastify from "fastify-type-provider-zod";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { toDotPath } from "zod/v4/core";

import * as contextModule from "../../src/context/context.ts";
import {
  type HTTPServiceName,
  serviceErrorCode,
} from "../../src/models/errors/services.ts";
import {
  type API_Problem,
  ApiError,
  commonErrorCodes,
} from "../../src/models/index.ts";
import { makeApiProblemBuilder } from "../../src/utils/problemBuilder.ts";

vi.mock("../../src/context/context.ts", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/context/context.ts")
  >("../../src/context/context.ts");

  return {
    ...actual,
    getContextValues: vi.fn(),
  };
});

vi.mock("fastify-type-provider-zod", async () => {
  const actual = await vi.importActual<
    typeof import("fastify-type-provider-zod")
  >("fastify-type-provider-zod");

  return {
    ...actual,
    hasZodFastifySchemaValidationErrors: vi.fn(),
    isResponseSerializationError: vi.fn(),
  };
});

const mockedHasZodFastifySchemaValidationErrors = vi.mocked(
  zodFastify.hasZodFastifySchemaValidationErrors,
);

const mockedIsResponseSerializationError = vi.mocked(
  zodFastify.isResponseSerializationError,
);

const mockedGetContextValues = vi.mocked(contextModule.getContextValues);
const defaultServiceName: HTTPServiceName = "backend-for-frontend";
const correlationIdMock = generateId<CorrelationId>();
const forceGenericSuffix =
  "forceGenericProblemOn500 is set to true, returning generic problem";

let loggerMock: {
  error: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
};

const genericProblemExpectation = {
  correlationId: correlationIdMock,
  detail: "Unexpected error",
  errorCode: commonErrorCodes.GENERIC_ERROR,
  serviceName: defaultServiceName,
  status: 500,
  title: "Unexpected Error",
};

function mockContextValues(overrides?: Partial<RequestContextData>) {
  loggerMock = {
    error: vi.fn(),
    warn: vi.fn(),
  };

  const defaultValues: RequestContextData = {
    authData: undefined,
    correlationId: correlationIdMock,
    logger: loggerMock as never,
  };

  mockedGetContextValues.mockReturnValue({ ...defaultValues, ...overrides });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockContextValues();
  mockedHasZodFastifySchemaValidationErrors.mockReturnValue(false);
  mockedIsResponseSerializationError.mockReturnValue(false);
});

const serviceName: HTTPServiceName = "backend-for-frontend";

// eslint-disable-next-line max-lines-per-function
describe("makeApiProblemBuilder", () => {
  const makeApiProblem = makeApiProblemBuilder({}, { serviceName });
  describe("mapping error codes", () => {
    it("should prefix error codes with the service code when serviceName is valid", () => {
      const serviceName: HTTPServiceName = defaultServiceName;
      const serviceNameCode = serviceErrorCode[serviceName];

      const error = makeApiProblem(new Error());

      expect(error.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: expect.stringMatching(new RegExp(`^${serviceNameCode}-`)),
          }),
        ]),
      );
    });
    it("should use fallback service code '000' when serviceName is invalid", () => {
      const makeApiProblem = makeApiProblemBuilder(
        {},
        { serviceName: "invalid-service-name" as HTTPServiceName },
      );

      const error = makeApiProblem(new Error());

      expect(error.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: expect.stringMatching(new RegExp(`^000-`)),
          }),
        ]),
      );
    });
    it("should resolve error codes from the provided custom mapping", () => {
      const customErrors = {
        CUSTOM_ERROR: "CUSTOM_ERROR_CODE",
      };
      const makeApiProblemWithCustomErrors = makeApiProblemBuilder(
        customErrors,
        { serviceName },
      );

      const error = makeApiProblemWithCustomErrors(
        new ApiError({
          errors: [{ code: "CUSTOM_ERROR", detail: "detail" }],
          status: 400,
          title: "title",
        }),
      );

      expect(error.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: expect.stringMatching(
              new RegExp(`-${customErrors.CUSTOM_ERROR}$`),
            ),
          }),
        ]),
      );
    });
  });

  describe("handling zod fastify schema validation errors", () => {
    it("should return a validation problem and log with warn level", () => {
      mockedHasZodFastifySchemaValidationErrors.mockReturnValue(true);
      const error = makeApiProblem({ validation: [{}] });

      expect(error).toMatchObject({
        errors: [
          {
            code: expect.stringContaining(
              commonErrorCodes.ZOD_FASTIFY_SCHEMA_VALIDATION_ERROR,
            ),
          },
        ],
        status: 400,
      });
      expect(loggerMock.warn).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("handling response serialization errors", () => {
    it("should return a serialization problem and log with warn level", () => {
      mockedIsResponseSerializationError.mockReturnValue(true);

      const testStatusCode = 418;

      const issueMessage = "test serialization error";
      const issuePath = ["results", 0, "createdAt"];
      const error = makeApiProblem({
        cause: {
          issues: [
            {
              code: "invalid_type",
              expected: "string",
              message: issueMessage,
              path: issuePath,
            } satisfies ZodIssue,
          ],
        },
        statusCode: testStatusCode,
      });

      expect(error).toMatchObject({
        errors: [
          {
            code: expect.stringContaining(
              commonErrorCodes.RESPONSE_SERIALIZATION_ERROR,
            ),
            detail: `${issueMessage} at response.${toDotPath(issuePath)}`,
          },
        ],
        status: testStatusCode,
      });
      expect(loggerMock.warn).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).not.toHaveBeenCalled();
    });
  });

  describe("handling ApiError", () => {
    it("should return a specific problem and log warn for non-500 status", () => {
      const makeApiProblem = makeApiProblemBuilder({}, { serviceName });
      const inputError = new ApiError({
        errors: [{ code: "GENERIC_ERROR", detail: "conflict detail" }],
        status: 409,
        title: "Conflict",
      });

      const problem = makeApiProblem(inputError);

      expectToMatchProblem(problem, {
        correlationId: correlationIdMock,
        detail: "conflict detail",
        errorCode: commonErrorCodes.GENERIC_ERROR,
        serviceName: defaultServiceName,
        status: 409,
        title: "Conflict",
      });
      expect(loggerMock.warn).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).not.toHaveBeenCalled();
    });

    it("should return a specific 500 problem when forceGenericProblemOn500 is disabled", () => {
      const makeApiProblem = makeApiProblemBuilder(
        {},
        {
          forceGenericProblemOn500: false,
          serviceName,
        },
      );
      const inputError = new ApiError({
        errors: [
          { code: "GENERIC_ERROR", detail: "sensitive internal detail" },
        ],
        status: 500,
        title: "Internal Server Error",
      });

      const problem = makeApiProblem(inputError);

      expectToMatchProblem(problem, {
        correlationId: correlationIdMock,
        detail: "sensitive internal detail",
        errorCode: commonErrorCodes.GENERIC_ERROR,
        serviceName: defaultServiceName,
        status: 500,
        title: "Internal Server Error",
      });
    });

    it("should return a generic problem and append forceGenericProblemOn500 suffix when enabled", () => {
      const makeApiProblem = makeApiProblemBuilder(
        {},
        { forceGenericProblemOn500: true, serviceName },
      );
      const inputError = new ApiError({
        errors: [{ code: "GENERIC_ERROR", detail: "should be hidden" }],
        status: 500,
        title: "Internal Server Error",
      });

      const problem = makeApiProblem(inputError);

      expectToMatchProblem(problem, genericProblemExpectation);
      expect(loggerMock.warn).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).not.toHaveBeenCalled();
      expect(loggerMock.warn).toHaveBeenCalledWith(
        expect.stringContaining(forceGenericSuffix),
      );
    });
  });

  describe("handling FastifyError", () => {
    const makeFastifyError = (statusCode: number, message: string) => {
      const FastifySpecificError = createError(
        "FST_TEST_ERROR",
        "%s",
        statusCode,
      );
      return new FastifySpecificError(message);
    };

    it("should use FastifyError statusCode when present", () => {
      const testStatusCode = 418;
      const inputError = makeFastifyError(testStatusCode, "teapot exploded");

      const problem = makeApiProblem(inputError);

      expectToMatchProblem(problem, {
        correlationId: correlationIdMock,
        detail: "teapot exploded",
        errorCode: commonErrorCodes.FASTIFY_ERROR,
        serviceName: defaultServiceName,
        status: testStatusCode,
        title: "I'm a Teapot",
      });
    });

    it("should default to 500 when FastifyError statusCode is undefined", () => {
      // in @fastify/error, passing 0 makes statusCode undefined internally
      const inputError = makeFastifyError(0, "no status code");

      const problem = makeApiProblem(inputError);

      expectToMatchProblem(problem, {
        correlationId: correlationIdMock,
        detail: "no status code",
        errorCode: commonErrorCodes.FASTIFY_ERROR,
        serviceName: defaultServiceName,
        status: 500,
        title: "Internal Server Error",
      });
    });

    it("should return a generic problem and append forceGenericProblemOn500 suffix on status 500 when enabled", () => {
      const makeApiProblem = makeApiProblemBuilder(
        {},
        { forceGenericProblemOn500: true, serviceName },
      );

      const inputError = makeFastifyError(500, "should be hidden");
      const problem = makeApiProblem(inputError);

      expectToMatchProblem(problem, genericProblemExpectation);
      expect(loggerMock.warn).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).not.toHaveBeenCalled();
      expect(loggerMock.warn).toHaveBeenCalledWith(
        expect.stringContaining(forceGenericSuffix),
      );
    });

    it("should return a specific problem on non-500 status even when forceGenericProblemOn500 is enabled", () => {
      const makeApiProblem = makeApiProblemBuilder(
        {},
        { forceGenericProblemOn500: true, serviceName },
      );

      const inputError = makeFastifyError(400, "bad request detail");
      const problem = makeApiProblem(inputError);

      expectToMatchProblem(problem, {
        correlationId: correlationIdMock,
        detail: "bad request detail",
        errorCode: commonErrorCodes.FASTIFY_ERROR,
        serviceName: defaultServiceName,
        status: 400,
        title: "Bad Request",
      });
    });
  });

  // eslint-disable-next-line max-lines-per-function
  describe("handling AxiosError with API_Problem payload", () => {
    const makeAxiosProblemError = ({
      problem,
      responseStatus,
    }: {
      problem: API_Problem;
      responseStatus: number;
    }) =>
      ({
        config: {} as never,
        isAxiosError: true,
        message: "Request failed",
        name: "AxiosError",
        response: {
          config: {} as never,
          data: problem,
          headers: {},
          status: responseStatus,
          statusText: "Error",
        },
        toJSON: () => ({}),
      }) as unknown;

    it("should passthrough the received problem when problemErrorsPassthrough is enabled", () => {
      const makeApiProblem = makeApiProblemBuilder(
        {},
        { problemErrorsPassthrough: true, serviceName },
      );

      const receivedProblem: API_Problem = {
        correlationId: correlationIdMock,
        errors: [{ code: "EXT-1001", detail: "downstream detail" }],
        status: 404,
        title: "Downstream Not Found",
      };

      const problem = makeApiProblem(
        makeAxiosProblemError({
          problem: receivedProblem,
          responseStatus: 404,
        }),
      );

      expect(problem).toBe(receivedProblem);
      expect(loggerMock.warn).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).not.toHaveBeenCalled();
    });

    it("should passthrough the received problem when forceGenericProblemOn500 is enabled but both statuses are non-500", () => {
      const makeApiProblem = makeApiProblemBuilder(
        {},
        {
          forceGenericProblemOn500: true,
          problemErrorsPassthrough: true,
          serviceName,
        },
      );

      const receivedProblem: API_Problem = {
        correlationId: correlationIdMock,
        errors: [{ code: "EXT-1001", detail: "downstream detail" }],
        status: 404,
        title: "Downstream Not Found",
      };

      const problem = makeApiProblem(
        makeAxiosProblemError({
          problem: receivedProblem,
          responseStatus: 400,
        }),
      );

      expect(problem).toBe(receivedProblem);
      expect(loggerMock.warn).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).not.toHaveBeenCalled();
      expect(loggerMock.warn).not.toHaveBeenCalledWith(
        expect.stringContaining(forceGenericSuffix),
      );
    });

    it("should return generic problem and append forceGenericProblemOn500 suffix when response.status is 500", () => {
      const makeApiProblem = makeApiProblemBuilder(
        {},
        {
          forceGenericProblemOn500: true,
          problemErrorsPassthrough: true,
          serviceName,
        },
      );

      const receivedProblem: API_Problem = {
        correlationId: correlationIdMock,
        errors: [{ code: "EXT-1002", detail: "downstream detail" }],
        status: 400,
        title: "Downstream Bad Request",
      };

      const problem = makeApiProblem(
        makeAxiosProblemError({
          problem: receivedProblem,
          responseStatus: 500,
        }),
      );

      expectToMatchProblem(problem, genericProblemExpectation);
      expect(loggerMock.warn).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).not.toHaveBeenCalled();
      expect(loggerMock.warn).toHaveBeenCalledWith(
        expect.stringContaining(forceGenericSuffix),
      );
    });

    it("should return generic problem and append forceGenericProblemOn500 suffix when received problem status is 500", () => {
      const makeApiProblem = makeApiProblemBuilder(
        {},
        {
          forceGenericProblemOn500: true,
          problemErrorsPassthrough: true,
          serviceName,
        },
      );

      const receivedProblem: API_Problem = {
        correlationId: correlationIdMock,
        errors: [{ code: "EXT-1003", detail: "downstream exploded" }],
        status: 500,
        title: "Downstream Internal Error",
      };

      const problem = makeApiProblem(
        makeAxiosProblemError({
          problem: receivedProblem,
          responseStatus: 400,
        }),
      );

      expectToMatchProblem(problem, genericProblemExpectation);
      expect(loggerMock.warn).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).not.toHaveBeenCalled();
      expect(loggerMock.warn).toHaveBeenCalledWith(
        expect.stringContaining(forceGenericSuffix),
      );
    });

    it("should return a generic problem when problemErrorsPassthrough is disabled", () => {
      const makeApiProblem = makeApiProblemBuilder(
        {},
        { problemErrorsPassthrough: false, serviceName },
      );

      const receivedProblem: API_Problem = {
        correlationId: correlationIdMock,
        errors: [{ code: "EXT-1004", detail: "downstream detail" }],
        status: 404,
        title: "Downstream Not Found",
      };

      const problem = makeApiProblem(
        makeAxiosProblemError({
          problem: receivedProblem,
          responseStatus: 404,
        }),
      );

      expectToMatchProblem(problem, genericProblemExpectation);
      expect(loggerMock.warn).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).not.toHaveBeenCalled();
      expect(loggerMock.warn).not.toHaveBeenCalledWith(
        expect.stringContaining(forceGenericSuffix),
      );
    });

    it("should return a generic problem when problemErrorsPassthrough is disabled even if forceGenericProblemOn500 is enabled", () => {
      const makeApiProblem = makeApiProblemBuilder(
        {},
        {
          forceGenericProblemOn500: true,
          problemErrorsPassthrough: false,
          serviceName,
        },
      );

      const receivedProblem: API_Problem = {
        correlationId: correlationIdMock,
        errors: [{ code: "EXT-1005", detail: "downstream detail" }],
        status: 500,
        title: "Downstream Internal Error",
      };

      const problem = makeApiProblem(
        makeAxiosProblemError({
          problem: receivedProblem,
          responseStatus: 500,
        }),
      );

      expectToMatchProblem(problem, genericProblemExpectation);
      expect(loggerMock.warn).toHaveBeenCalledTimes(1);
      expect(loggerMock.error).not.toHaveBeenCalled();
      expect(loggerMock.warn).not.toHaveBeenCalledWith(
        expect.stringContaining(forceGenericSuffix),
      );
    });
  });

  describe("handling AxiosError without API_Problem payload", () => {
    it("should fallback to a generic problem when isAxiosError is true but payload schema does not match API_Problem", () => {
      const nonConformingAxiosError = {
        isAxiosError: true,
        message: "Request failed",
        name: "AxiosError",
        response: {
          data: { foo: "bar" },
          status: 400,
        },
      } as unknown;

      const problem = makeApiProblem(nonConformingAxiosError);

      expectToMatchProblem(problem, genericProblemExpectation);
      expect(loggerMock.error).toHaveBeenCalledTimes(1);
      expect(loggerMock.warn).not.toHaveBeenCalled();
    });
  });

  describe("handling API_Problem-like payloads that are not AxiosError", () => {
    it("should fallback to a generic problem when payload matches API_Problem schema but isAxiosError is false", () => {
      const problemLikePayload = {
        isAxiosError: false,
        response: {
          data: {
            correlationId: correlationIdMock,
            errors: [{ code: "EXT-2001", detail: "downstream detail" }],
            status: 404,
            title: "Downstream Not Found",
          },
          status: 404,
        },
      } as unknown;

      const problem = makeApiProblem(problemLikePayload);

      expectToMatchProblem(problem, genericProblemExpectation);
      expect(loggerMock.error).toHaveBeenCalledTimes(1);
      expect(loggerMock.warn).not.toHaveBeenCalled();
    });
  });

  describe("handling ZodError", () => {
    it("should return a generic problem and log with error level", () => {
      const problem = makeApiProblem(new ZodError([]));
      expectToMatchProblem(problem, genericProblemExpectation);
      expect(loggerMock.error).toHaveBeenCalledTimes(1);
      expect(loggerMock.warn).not.toHaveBeenCalled();
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.stringContaining("title: Unexpected Error"),
      );
    });
  });

  describe("handling unknown errors", () => {
    it("should return a generic problem and log with error level", () => {
      const problem = makeApiProblem({ something: "unexpected" });
      expectToMatchProblem(problem, genericProblemExpectation);
      expect(loggerMock.error).toHaveBeenCalledTimes(1);
      expect(loggerMock.warn).not.toHaveBeenCalled();
    });
  });

  describe("handling failed SQL queries", () => {
    it("should not log the query's free-text params", () => {
      const email = "mario.rossi@example.com";

      makeApiProblem(
        new DrizzleQueryError("select 1 where email = $1", [email]),
      );

      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.stringContaining(
          "Failed query: select 1 where email = $1\nparams: <redacted>",
        ),
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.not.stringContaining(email),
      );
    });
  });

  describe("building the returned API_Problem shape", () => {
    it("should include correlationId from request context", () => {
      const correlationId = generateId<CorrelationId>();
      mockContextValues({ correlationId });

      const problem = makeApiProblem(new Error("boom"));

      expect(problem.correlationId).toBe(correlationId);
    });

    it("should include status, title and mapped errors in API_Problem format", () => {
      const inputError = new ApiError({
        errors: [{ code: "GENERIC_ERROR", detail: "shape detail" }],
        status: 409,
        title: "Conflict",
      });

      const problem = makeApiProblem(inputError);

      expect(problem.status).toBe(409);
      expect(problem.title).toBe("Conflict");
      expect(problem.errors).toEqual([
        {
          code: `${serviceErrorCode["backend-for-frontend"]}-${commonErrorCodes.GENERIC_ERROR}`,
          detail: "shape detail",
        },
      ]);
    });
  });
});

function expectToMatchProblem(
  problem: API_Problem,
  {
    correlationId,
    detail,
    errorCode,
    serviceName,
    status,
    title,
  }: {
    correlationId: CorrelationId;
    detail: string;
    errorCode: string;
    serviceName: HTTPServiceName;
    status: number;
    title: string;
  },
) {
  expect(problem).toEqual({
    correlationId,
    errors: [
      {
        code: `${serviceErrorCode[serviceName]}-${errorCode}`,
        detail,
      },
    ],
    status,
    title,
  });
}
