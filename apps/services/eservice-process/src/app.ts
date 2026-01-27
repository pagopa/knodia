import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";

import { config } from "./config/config.ts";
import { apiTags } from "./models/apiTags.ts";
import { makeApiProblem } from "./models/errors.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";
import { eserviceServiceBuilder } from "./services/eserviceService.ts";

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
  makeApiProblem,
  serviceName: config.serviceName,
});

app.register(healthRouter);
app.register(eserviceRouter, eserviceServiceBuilder());

export default app;
