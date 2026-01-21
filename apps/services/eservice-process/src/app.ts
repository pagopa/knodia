import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";
import { serviceName } from "@knodia/fastify-zod-api-commons/models";

import { apiTags } from "./models/apiTags.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";

const app = createFastifyApp(serviceName.ESERVICE_PROCESS, {
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
