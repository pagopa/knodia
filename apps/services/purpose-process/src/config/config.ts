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

export const PurposeFormsConfig = z
  .object({
    PURPOSE_FORMS_BUCKET: z.string(),
    PURPOSE_FORMS_CURRENT_TTL_MS: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(60_000),
  })
  .transform((c) => ({
    purposeFormsBucket: c.PURPOSE_FORMS_BUCKET,
    purposeFormsCurrentTtlMs: c.PURPOSE_FORMS_CURRENT_TTL_MS,
  }));
export type PurposeFormsConfig = z.infer<typeof PurposeFormsConfig>;

const PurposeProcessConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(EventStorePurposeConfig)
  .and(ReadmodelAgreementConfig)
  .and(ReadmodelEserviceConfig)
  .and(ReadmodelPurposeConfig)
  .and(PurposeFormsConfig);
export type PurposeProcessConfig = z.infer<typeof PurposeProcessConfig>;

export const config = PurposeProcessConfig.parse(process.env);
