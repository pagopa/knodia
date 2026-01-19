import { healthRouterTag } from "../../src/routers/healthRouter.ts";
import { testTags } from "./testRouter.ts";

const expectedPaginationSchema = {
  additionalProperties: false,
  properties: {
    limit: {
      format: "int32",
      maximum: 50,
      minimum: 1,
      type: "number",
    },
    offset: {
      format: "int32",
      minimum: 0,
      type: "number",
    },
    total: { format: "int32", minimum: 0, type: "number" },
  },
  required: ["limit", "offset", "total"],
  type: "object",
};

const expectedTestSchema = {
  additionalProperties: false,
  properties: {
    test: { type: "string" },
  },
  required: ["test"],
  type: "object",
};

const expectedTestsSchema = {
  allOf: [
    {
      additionalProperties: false,
      properties: {
        results: {
          items: {
            $ref: "#/components/schemas/Test",
          },
          type: "array",
        },
      },
      required: ["results"],
      type: "object",
    },
    {
      $ref: "#/components/schemas/Pagination",
    },
  ],
};

export const expectedOpenApiComponents = {
  schemas: {
    Pagination: expectedPaginationSchema,
    Test: expectedTestSchema,
    Tests: expectedTestsSchema,
  },
};

export const expectedTestGet = {
  description: "Test GET endpoint",
  operationId: "getTest",
  parameters: [
    {
      description: "A string filter",
      in: "query",
      name: "query",
      required: true,
      schema: { type: "string" },
    },
    {
      description: "Maximum number of items returned",
      in: "query",
      name: "limit",
      required: true,
      schema: { format: "int32", maximum: 50, minimum: 1, type: "number" },
    },
    {
      description: "Pagination starting position",
      in: "query",
      name: "offset",
      required: true,
      schema: { format: "int32", minimum: 0, type: "number" },
    },
  ],
  responses: {
    "200": {
      content: {
        "application/json": {
          schema: {
            allOf: [
              {
                $ref: "#/components/schemas/Tests",
              },
            ],
            description: "Results retrieved successfully",
          },
        },
      },
      description: "Results retrieved successfully",
    },
  },
  tags: [testTags.test],
};

export const expectedTestPost = {
  description: "Test POST endpoint",
  operationId: "createTest",
  requestBody: {
    content: {
      "application/json": {
        schema: {
          $ref: "#/components/schemas/Test",
        },
      },
    },
  },
  responses: {
    "201": {
      content: {
        "application/json": {
          schema: {
            allOf: [
              {
                $ref: "#/components/schemas/Test",
              },
            ],
            description: "Resource created successfully",
          },
        },
      },
      description: "Resource created successfully",
    },
  },
  tags: [testTags.test],
};

export const expectedStatusGet = {
  get: {
    description: "Check the health status of the service",
    operationId: "getStatus",
    responses: {
      "200": {
        content: {
          "application/json": {
            schema: {
              description: "Service status OK",
            },
          },
        },
        description: "Service status OK",
      },
    },
    tags: [healthRouterTag.name],
  },
};

export const expectedOpenApiPaths = {
  "/status": expectedStatusGet,
  "/test": {
    get: expectedTestGet,
    post: expectedTestPost,
  },
};
