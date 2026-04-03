import { EventStoreEserviceConfig } from "@knodia/db-event-store-eservice/config";
import { ReadmodelEserviceConfig } from "@knodia/db-readmodel-eservice/config";
import { ReadmodelOrganizationConfig } from "@knodia/db-readmodel-organization/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const EserviceProcessConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(EventStoreEserviceConfig)
  .and(ReadmodelEserviceConfig)
  .and(ReadmodelOrganizationConfig)
  .and(
    z
      .object({
        IS_CONSUMER_OPERATOR_IDENTIFICATION_REQUIRED: z.stringbool(),
      })
      .transform((c) => ({
        isConsumerOperatorIdentificationRequired:
          c.IS_CONSUMER_OPERATOR_IDENTIFICATION_REQUIRED,
      })),
  );
export type EserviceProcessConfig = z.infer<typeof EserviceProcessConfig>;

export const config = EserviceProcessConfig.parse(process.env);
