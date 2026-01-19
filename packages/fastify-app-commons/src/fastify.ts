import type { ServiceName } from "@knodia/common-models";

import fastifyRequestContext from "@fastify/request-context";
import openapiZodPlugin, {
  type OpenapiZodPluginOptions,
} from "@knodia/fastify-zod-api-commons/openApiZodPlugin";
import Fastify, { type FastifyRegisterOptions } from "fastify";

export const createFastifyClient = (
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
