import fastifyRequestContext from "@fastify/request-context";
import Fastify, { type FastifyRegisterOptions } from "fastify";

import type { ServiceName } from "../models/errors/services.ts";

import { missingHeader } from "../models/errors/errors.ts";
import openapiZodPlugin, {
  type OpenapiZodPluginOptions,
} from "./openapi-zod-plugin/openapiZodPlugin.ts";
import { makeApiProblemBuilder } from "./problemBuilder.ts";

const makeApiProblem = makeApiProblemBuilder({});

export const createFastifyApp = (
  serviceName: ServiceName,
  openapi: FastifyRegisterOptions<OpenapiZodPluginOptions>,
  readCorrelationIdFromHeader = true,
) => {
  const app = Fastify({
    logger: true, // TODO configure logger - winston? pino?
  });

  // openapiPlugin must be registered before any routes to ensure proper route discovery
  app.register(openapiZodPlugin, openapi);

  app.register(fastifyRequestContext, {
    defaultStoreValues: (request) => ({
      correlationId:
        request.headers["x-correlation-id"]?.toString() || crypto.randomUUID(),
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
      const correlationId = req.headers["x-correlation-id"];

      if (!correlationId) {
        const problem = makeApiProblem(missingHeader("X-Correlation-Id"));
        return res.status(problem.status).send(problem);
      }
    });
  }
};
