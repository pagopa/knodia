import { ReadmodelOrganizationConfig } from "@knodia/db-readmodel-organization/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const OrganizationProcessConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(ReadmodelOrganizationConfig);
export type OrganizationProcessConfig = z.infer<
  typeof OrganizationProcessConfig
>;

export const config = OrganizationProcessConfig.parse(process.env);
