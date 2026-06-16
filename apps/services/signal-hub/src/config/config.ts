import { KnodeId } from "@knodia/common-models/ids";
import { ReadmodelAgreementConfig } from "@knodia/db-readmodel-agreement/config";
import { ReadmodelEserviceConfig } from "@knodia/db-readmodel-eservice/config";
import { ReadmodelPurposeConfig } from "@knodia/db-readmodel-purpose/config";
import { SignalHubDbConfig } from "@knodia/db-signal-hub/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { RateLimiterConfig } from "@knodia/fastify-zod-api-commons/rate-limit";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const SignalHubConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(ReadmodelEserviceConfig)
  .and(ReadmodelAgreementConfig)
  .and(ReadmodelPurposeConfig)
  .and(SignalHubDbConfig)
  .and(RateLimiterConfig)
  .and(
    z
      .object({
        KNODE_ID: KnodeId,
        KNODIA_ENVIRONMENT: z
          .string()
          .min(1)
          .regex(
            /^[^:]+$/,
            "must not contain ':' (used as rate-limit key separator)",
          ),
      })
      .transform((c) => ({
        knodeId: c.KNODE_ID,
        knodiaEnvironment: c.KNODIA_ENVIRONMENT,
      })),
  );
export type SignalHubConfig = z.infer<typeof SignalHubConfig>;

export const config = SignalHubConfig.parse(process.env);
