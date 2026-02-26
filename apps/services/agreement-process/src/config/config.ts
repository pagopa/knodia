import { EventStoreAgreementConfig } from "@knodia/db-event-store-agreement/config";
import { ReadmodelAgreementConfig } from "@knodia/db-readmodel-agreement/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const AgreementProcessConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(EventStoreAgreementConfig)
  .and(ReadmodelAgreementConfig);
export type AgreementProcessConfig = z.infer<typeof AgreementProcessConfig>;

export const config = AgreementProcessConfig.parse(process.env);
