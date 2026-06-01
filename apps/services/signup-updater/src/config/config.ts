import { SignupDbConfig } from "@knodia/db-signup/config";
import {
  KafkaConsumerConfig,
  SignupTopicConfig,
} from "@knodia/kafka-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const SignupUpdaterConfig = LoggerConfig.and(KafkaConsumerConfig)
  .and(SignupTopicConfig)
  .and(SignupDbConfig)
  .and(
    z
      .object({
        COGNITO_USER_POOL_ID_LYNX: z.string().min(1),
        COGNITO_USER_POOL_ID_ORION: z.string().min(1),
        INTERNAL_JWT_AUDIENCE: z.string().min(1),
        INTERNAL_JWT_ISSUER: z.string().min(1),
        INTERNAL_JWT_KID: z.string().min(1),
        INTERNAL_JWT_SECONDS_DURATION: z.coerce
          .number()
          .int()
          .positive()
          .default(3600),
        INTERNAL_JWT_SUBJECT: z.string().min(1),
        ORGANIZATION_PROCESS_LYNX_URL: z.url(),
        ORGANIZATION_PROCESS_ORION_URL: z.url(),
      })
      .transform((c) => ({
        cognitoUserPoolIds: {
          Lynx: c.COGNITO_USER_POOL_ID_LYNX,
          Orion: c.COGNITO_USER_POOL_ID_ORION,
        },
        internalJwt: {
          audience: c.INTERNAL_JWT_AUDIENCE,
          issuer: c.INTERNAL_JWT_ISSUER,
          kid: c.INTERNAL_JWT_KID,
          secondsDuration: c.INTERNAL_JWT_SECONDS_DURATION,
          subject: c.INTERNAL_JWT_SUBJECT,
        },
        organizationProcessUrls: {
          Lynx: c.ORGANIZATION_PROCESS_LYNX_URL,
          Orion: c.ORGANIZATION_PROCESS_ORION_URL,
        },
      })),
  );
type SignupUpdaterConfig = z.infer<typeof SignupUpdaterConfig>;

export const config: SignupUpdaterConfig = SignupUpdaterConfig.parse(
  process.env,
);
