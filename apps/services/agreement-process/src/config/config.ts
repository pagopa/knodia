import { KnodeId } from "@knodia/common-models/ids";
import { EventStoreAgreementConfig } from "@knodia/db-event-store-agreement/config";
import { ReadmodelAgreementConfig } from "@knodia/db-readmodel-agreement/config";
import { ReadmodelEserviceConfig } from "@knodia/db-readmodel-eservice/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const AgreementProcessConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(EventStoreAgreementConfig)
  .and(ReadmodelAgreementConfig)
  .and(ReadmodelEserviceConfig)
  .and(
    z
      .object({
        KNODE_ID: KnodeId,
      })
      .transform((c) => ({
        knodeId: c.KNODE_ID,
      })),
  );
export type AgreementProcessConfig = z.infer<typeof AgreementProcessConfig>;

export const config = AgreementProcessConfig.parse(process.env);
