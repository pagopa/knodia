import type z from "zod";

import { ReadmodelEserviceConfig } from "@knodia/db-readmodel-eservice/config";
import { SignalHubDbConfig } from "@knodia/db-signal-hub/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";

const SignalHubConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(ReadmodelEserviceConfig)
  .and(SignalHubDbConfig);
export type SignalHubConfig = z.infer<typeof SignalHubConfig>;

export const config = SignalHubConfig.parse(process.env);
