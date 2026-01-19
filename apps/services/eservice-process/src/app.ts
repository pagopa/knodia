import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import openapiZodPlugin from "@knodia/fastify-zod-api-commons/openApiZodPlugin";
import { buildLoggerOptions } from "@knodia/logger/options";
import Fastify from "fastify";

import { config } from "./config.ts";
import { apiTags } from "./models/apiTags.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";

const app = Fastify({
  logger: buildLoggerOptions({
    logLevel: config.logLevel,
    prettyPrint: !config.isProduction,
    serviceName: config.serviceName,
  }),
});

// openapiPlugin must be registered before any routes to ensure proper route discovery
app.register(openapiZodPlugin, {
  openapi: {
    info: {
      description: "API for managing Knodia E-services",
      title: "Knodia E-service Process API",
      version: "1.0.0",
    },
    servers: [{ description: "E-service Process API", url: "/" }],
    tags: [
      healthRouterTag,
      {
        description: "E-services routes",
        name: apiTags.eservice,
      },
    ],
  },
});

app.register(healthRouter);
app.register(eserviceRouter);

export default app;
