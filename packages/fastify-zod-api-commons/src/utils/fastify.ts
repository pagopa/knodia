import type { LoggerConfig } from "@knodia/logger/config";

import fastifyRequestContext from "@fastify/request-context";
import { createLoggerOptions } from "@knodia/logger";
import Fastify, { type FastifyRegisterOptions } from "fastify";

import { missingHeader } from "../models/errors/errors.ts";
import { CORRELATION_ID_HEADER } from "../models/headers.ts";
import openapiZodPlugin, {
  type OpenapiZodPluginOptions,
} from "./openapi-zod-plugin/openapiZodPlugin.ts";
import { makeApiProblemBuilder } from "./problemBuilder.ts";

const makeApiProblem = makeApiProblemBuilder({});

export const createFastifyApp = ({
  fastifyOptions,
  loggerConfig,
  readCorrelationIdFromHeader = true,
  serviceName,
}: {
  fastifyOptions: FastifyRegisterOptions<OpenapiZodPluginOptions>;
  loggerConfig: LoggerConfig;
  readCorrelationIdFromHeader?: boolean;
  serviceName: string;
}) => {
  const app = Fastify({
    logger: createLoggerOptions(loggerConfig, serviceName),
  });

  // openapiPlugin must be registered before any routes to ensure proper route discovery
  app.register(openapiZodPlugin, fastifyOptions);

  app.register(fastifyRequestContext, {
    defaultStoreValues: (request) => ({
      correlationId:
        request.headers[CORRELATION_ID_HEADER]?.toString() ||
        crypto.randomUUID(),
      logger: request.log,
      serviceName,
    }),
  });

  checkCorrelationIdHeader(app, readCorrelationIdFromHeader);

  app.setErrorHandler((error, _, res) => {
    const errorRes = makeApiProblem(error);

    return res
      .status(errorRes.status)
      .type("application/problem+json")
      .send(errorRes);
  });

  return app;
};

const checkCorrelationIdHeader = (
  app: Fastify.FastifyInstance,
  readCorrelationIdFromHeader: boolean,
) => {
  if (readCorrelationIdFromHeader) {
    app.addHook("onRequest", async (req, res) => {
      const correlationId = req.headers[CORRELATION_ID_HEADER];

      if (!correlationId) {
        const problem = makeApiProblem(missingHeader(CORRELATION_ID_HEADER));
        return res.status(problem.status).send(problem);
      }
    });
  }
};
