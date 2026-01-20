import fastifyRequestContext from "@fastify/request-context";
import Fastify, { type FastifyRegisterOptions } from "fastify";

import type { ServiceName } from "../models/errors/services.ts";

import openapiZodPlugin, {
  type OpenapiZodPluginOptions,
} from "./openapi-zod-plugin/openapiZodPlugin.ts";

export const createFastifyApp = (
  serviceName: ServiceName,
  openapi: FastifyRegisterOptions<OpenapiZodPluginOptions>,
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

  return app;
};
