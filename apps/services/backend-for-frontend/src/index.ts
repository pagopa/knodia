import { startServer } from "@knodia/fastify-zod-api-commons/startServer";

import app from "./app.ts";
import { config } from "./config/config.ts";

void startServer(app, { host: config.host, port: config.port });
