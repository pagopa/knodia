import type { FastifyRegisterOptions } from "fastify";

import type { OpenapiZodPluginOptions } from "../../src/utils/openapi-zod-plugin/openapiZodPlugin.ts";

import { createFastifyApp } from "../../src/utils/fastify.ts";
import { makeApiProblemBuilder } from "../../src/utils/problemBuilder.ts";

const makeApiProblem = makeApiProblemBuilder(
  {},
  { serviceName: "eservice-process" },
);

export const buildTestApp = (
  fastifyOptions?: FastifyRegisterOptions<OpenapiZodPluginOptions>,
) =>
  createFastifyApp({
    fastifyOptions: fastifyOptions ?? {
      openapi: { info: { title: "Test", version: "0.0.0" } },
    },
    loggerConfig: { isProduction: false, logLevel: "silent", nodeEnv: "test" },
    makeApiProblem,
  });
