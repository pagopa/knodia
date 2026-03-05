import { createInjectAppRequest } from "@knodia/test-commons/fastify";

import { app } from "./setup.ts";

export const injectAppRequest = createInjectAppRequest(() => app);
