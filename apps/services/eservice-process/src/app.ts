import openapiZodPlugin from "@knodia/fastify-plugin-openapi-zod";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { buildLoggerOptions } from "@knodia/logger/config";
import Fastify from "fastify";

import { apiTags } from "./models/apiTags.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";

const app = Fastify({
  logger: buildLoggerOptions({ serviceName: "eservice-process" }),
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
