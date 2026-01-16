import { serviceName } from "@knodia/common-models";
import { registerErrorHandler } from "@knodia/error-commons";
import { createFastifyClient } from "@knodia/fastify-app-commons";

import { eserviceRouter } from "./routers/eserviceRouter.ts";

const app = createFastifyClient(serviceName.ESERVICE_PROCESS);

app.register(eserviceRouter);
registerErrorHandler(app);

export default app;
