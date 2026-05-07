import { EventStoreOrganizationConfig } from "@knodia/db-event-store-organization/config";
import { ReadmodelOrganizationConfig } from "@knodia/db-readmodel-organization/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { IdmClientConfig } from "@knodia/idm-client";
import { LoggerConfig } from "@knodia/logger/config";
import { type z } from "zod";

const OrganizationProcessConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(EventStoreOrganizationConfig)
  .and(ReadmodelOrganizationConfig)
  .and(IdmClientConfig);
export type OrganizationProcessConfig = z.infer<
  typeof OrganizationProcessConfig
>;

export const config = OrganizationProcessConfig.parse(process.env);
