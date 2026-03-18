import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const PurposeProcessConfig = LoggerConfig.and(HTTPServerConfig).and(AuthConfig);
export type PurposeProcessConfig = z.infer<typeof PurposeProcessConfig>;

export const config = PurposeProcessConfig.parse(process.env);
