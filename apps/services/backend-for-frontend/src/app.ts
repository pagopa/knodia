import { serviceName } from "@knodia/common-models";
import { registerErrorHandler } from "@knodia/error-commons";
import { createFastifyClient } from "@knodia/fastify-app-commons";

import { getKnodiaClients } from "./clients/clientsProvider.ts";
import { eserviceRouter } from "./routers/eserviceRouter.ts";

const app = createFastifyClient(serviceName.BACKEND_FOR_FRONTEND, {
  description: "Knodia backend-for-frontend API",
  title: "Knodia BFF API",
  version: "1.0.0",
});

const clients = getKnodiaClients();

app.register(eserviceRouter, clients.eserviceProcessClient);
registerErrorHandler(app);

export default app;
