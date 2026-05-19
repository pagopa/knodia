import type z from "zod";

import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";

const SignalHubConfig = LoggerConfig.and(HTTPServerConfig).and(AuthConfig);
export type SignalHubConfig = z.infer<typeof SignalHubConfig>;

export const config = SignalHubConfig.parse(process.env);
