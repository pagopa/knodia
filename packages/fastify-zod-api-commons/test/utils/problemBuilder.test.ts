import type { RequestContextData } from "@fastify/request-context";
import type { HTTPServiceName } from "@knodia/common-models/services";

import createError from "@fastify/error";
import { CorrelationId, generateId } from "@knodia/common-models/ids";
import * as zodFastify from "fastify-type-provider-zod";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import * as contextModule from "../../src/context/context.ts";
import { serviceErrorCode } from "../../src/models/errors/services.ts";
import {
  API_Problem,
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

const genericProblemExpectation = {
  correlationId: correlationIdMock,
  detail: "Unexpected error",
  errorCode: commonErrorCodes.GENERIC_ERROR,
  serviceName: defaultServiceName,
  status: 500,
  title: "Unexpected Error",
};

function mockContextValues(overrides?: Partial<RequestContextData>) {
  const defaultValues: RequestContextData = {
    authData: undefined,
    correlationId: correlationIdMock,
    logger: {
      error: vi.fn(),
      warn: vi.fn(),
    } as never,
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
  describe("error code mapping", () => {
    it("prefixes error codes with serviceErrorCode when serviceName is valid", () => {
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
    it("uses the fallback serviceErrorCode '000' when serviceName is invalid", () => {
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
    it("resolves codes from custom mapping passed in errors", () => {
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

  describe("zod fastify schema validation error", () => {
    it("returns problem from zodFastifySchemaValidationError", () => {
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
    });
  });

  describe("response serialization error", () => {
    it("returns problem from responseSerializationError", () => {
      mockedIsResponseSerializationError.mockReturnValue(true);

      const testStatusCode = 418;

      const error = makeApiProblem({
        cause: { issues: [{}] },
        statusCode: testStatusCode,
      });

      expect(error).toMatchObject({
        errors: [
          {
            code: expect.stringContaining(
              commonErrorCodes.RESPONSE_SERIALIZATION_ERROR,
            ),
          },
        ],
        status: testStatusCode,
      });
    });
  });

  describe("ApiError branch", () => {
    it("returns problem derived from ApiError when status != 500", () => {
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
    });

    it("returns problem derived from ApiError when status = 500 and forceGenericProblemOn500=false", () => {
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

    it("returns genericProblem when status = 500 and forceGenericProblemOn500=true", () => {
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
    });
  });

  describe("FastifyError branch", () => {
    const makeFastifyError = (statusCode: number, message: string) => {
      const FastifySpecificError = createError(
        "FST_TEST_ERROR",
        "%s",
        statusCode,
      );
      return new FastifySpecificError(message);
    };

    it("uses statusCode from FastifyError if present", () => {
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

    it("uses 500 when statusCode from FastifyError is undefined", () => {
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

    it("returns genericProblem on status 500 when forceGenericProblemOn500=true", () => {
      const makeApiProblem = makeApiProblemBuilder(
        {},
        { forceGenericProblemOn500: true, serviceName },
      );

      const inputError = makeFastifyError(500, "should be hidden");
      const problem = makeApiProblem(inputError);

      expectToMatchProblem(problem, genericProblemExpectation);
    });

    it("returns specific problem on non-500 status even with forceGenericProblemOn500=true", () => {
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

  describe("AxiosError<API_Problem> passthrough", () => {
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

    it.only("returns receivedProblem unchanged when problemErrorsPassthrough=true", () => {
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
    });

    it("returns genericProblem when problemErrorsPassthrough=true and response.status=500 with forceGenericProblemOn500=true", () => {
      const makeApiProblem = makeApiProblemBuilder(
        {},
        {
          forceGenericProblemOn500: true,
          problemErrorsPassthrough: true,
          serviceName,
        },
      );

      const receivedProblem: API_Problem = {
        correlationId: "downstream-correlation-id",
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
    });

    it("returns genericProblem when problemErrorsPassthrough=true and receivedProblem.status=500 with forceGenericProblemOn500=true", () => {
      const makeApiProblem = makeApiProblemBuilder(
        {},
        {
          forceGenericProblemOn500: true,
          problemErrorsPassthrough: true,
          serviceName,
        },
      );

      const receivedProblem: API_Problem = {
        correlationId: "downstream-correlation-id",
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
    });

    it("returns genericProblem when problemErrorsPassthrough=false", () => {
      const makeApiProblem = makeApiProblemBuilder(
        {},
        { problemErrorsPassthrough: false, serviceName },
      );

      const receivedProblem: API_Problem = {
        correlationId: "downstream-correlation-id",
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
    });
  });

  describe("AxiosError not conform a API_Problem", () => {
    it("does not enter the passthrough branch and falls back to generic", () => {
      const nonConformingAxiosError = {
        isAxiosError: true,
        message: "Request failed",
        name: "AxiosError",
        response: {
          data: { foo: "bar" },
          status: 400,
        },
        toJSON: () => ({}),
      } as unknown;

      const problem = makeApiProblem(nonConformingAxiosError);

      expectToMatchProblem(problem, genericProblemExpectation);
    });
  });

  describe("ZodError branch", () => {
    it("returns genericProblem", () => {
      const problem = makeApiProblem(new ZodError([]));
      expectToMatchProblem(problem, genericProblemExpectation);
    });
  });

  describe("fallback unknown error", () => {
    it("returns genericProblem on unmatched error", () => {
      const problem = makeApiProblem({ something: "unexpected" });
      expectToMatchProblem(problem, genericProblemExpectation);
    });
  });

  describe("shape of the returned problem", () => {
    it("includes correlationId from the request context in locally constructed problems", () => {
      const correlationId = generateId<CorrelationId>();
      mockContextValues({ correlationId });

      const problem = makeApiProblem(new Error("boom"));

      expect(problem.correlationId).toBe(correlationId);
    });

    it("includes status, title and errors mapped in the API_Problem format", () => {
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
