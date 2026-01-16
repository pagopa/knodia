import { serviceName } from "@knodia/common-models";
import { registerErrorHandler } from "@knodia/error-commons";
import { createFastifyClient } from "@knodia/fastify-app-commons";

import { eserviceRouter } from "./routers/eserviceRouter.ts";

const app = createFastifyClient(serviceName.ESERVICE_PROCESS, {
  description: "API for managing Knodia E-services",
  title: "Knodia E-service Process API",
  version: "1.0.0",
});

app.register(eserviceRouter);
registerErrorHandler(app);

export default app;
