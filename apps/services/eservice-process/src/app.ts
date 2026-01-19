import { serviceName } from "@knodia/common-models";
import { registerErrorHandler } from "@knodia/error-commons";
import { createFastifyClient } from "@knodia/fastify-app-commons";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";

import { apiTags } from "./models/apiTags.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";

const app = createFastifyClient(serviceName.ESERVICE_PROCESS, {
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
registerErrorHandler(app);

export default app;
