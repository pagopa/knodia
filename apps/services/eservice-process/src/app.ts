import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";

import { config } from "./config/config.ts";
import { apiTags } from "./models/apiTags.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";

const app = createFastifyApp({
  fastifyOptions: {
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
  },
  loggerConfig: config,
  serviceName: config.serviceName,
});

app.register(healthRouter);
app.register(eserviceRouter);

export default app;
