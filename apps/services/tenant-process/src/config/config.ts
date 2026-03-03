import { ReadmodelTenantConfig } from "@knodia/db-readmodel-tenant/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const TenantProcessConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(ReadmodelTenantConfig);
export type TenantProcessConfig = z.infer<typeof TenantProcessConfig>;

export const config = TenantProcessConfig.parse(process.env);
