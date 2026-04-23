import { EventStorePurposeConfig } from "@knodia/db-event-store-purpose/config";
import { ReadmodelAgreementConfig } from "@knodia/db-readmodel-agreement/config";
import { ReadmodelEserviceConfig } from "@knodia/db-readmodel-eservice/config";
import { ReadmodelPurposeConfig } from "@knodia/db-readmodel-purpose/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import z from "zod";

const PurposeFormsConfigSchema = z
  .object({
    PURPOSE_FORMS_DIR: z.string().min(1),
  })
  .transform((c) => ({
    purposeFormsDir: c.PURPOSE_FORMS_DIR,
  }));
export type PurposeFormsConfig = z.infer<typeof PurposeFormsConfigSchema>;

const PurposeProcessConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(EventStorePurposeConfig)
  .and(ReadmodelAgreementConfig)
  .and(ReadmodelEserviceConfig)
  .and(ReadmodelPurposeConfig)
  .and(PurposeFormsConfigSchema);
export type PurposeProcessConfig = z.infer<typeof PurposeProcessConfig>;

export const config = PurposeProcessConfig.parse(process.env);
