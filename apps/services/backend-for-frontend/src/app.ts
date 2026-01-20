import { serviceName } from "@knodia/common-models";
import { registerErrorHandler } from "@knodia/error-commons";
import { createFastifyApp } from "@knodia/fastify-zod-api-commons/fastify";
import {
  healthRouter,
  healthRouterTag,
} from "@knodia/fastify-zod-api-commons/health";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { apiTags } from "./models/apiTags.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";

const clients = getKnodiaClients();

const app = createFastifyApp(serviceName.BACKEND_FOR_FRONTEND, {
  openapi: {
    info: {
      description: "Knodia backend-for-frontend API",
      title: "Knodia BFF API",
      version: "1.0.0",
    },
    servers: [{ description: "BFF API", url: "/" }],
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
app.register(eserviceRouter, clients.eserviceProcessClient);
registerErrorHandler(app);

export default app;
