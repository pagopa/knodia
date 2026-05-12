import { CognitoIdmClientConfig } from "@knodia/cognito-idm-client";
import { KnodeId } from "@knodia/common-models/ids";
import { EventStoreOrganizationConfig } from "@knodia/db-event-store-organization/config";
import { ReadmodelOrganizationConfig } from "@knodia/db-readmodel-organization/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const OrganizationProcessConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(EventStoreOrganizationConfig)
  .and(ReadmodelOrganizationConfig)
  .and(CognitoIdmClientConfig)
  .and(
    z
      .object({
        KNODE_ID: KnodeId,
      })
      .transform((c) => ({
        knodeId: c.KNODE_ID,
      })),
  );
export type OrganizationProcessConfig = z.infer<
  typeof OrganizationProcessConfig
>;

export const config = OrganizationProcessConfig.parse(process.env);
