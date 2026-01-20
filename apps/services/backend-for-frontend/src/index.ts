import { startServer } from "@knodia/fastify-zod-api-commons/startServer";

import app from "./app.ts";

void startServer(app, { host: "0.0.0.0", port: 3600 });
