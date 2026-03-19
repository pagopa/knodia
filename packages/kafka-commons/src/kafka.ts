import type { CommonConstructorConfig } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { Logger } from "pino";

import { KafkaJS } from "@confluentinc/kafka-javascript";
import {
  generateAuthTokenFromRole,
  type GenerateAuthTokenResponse,
} from "aws-msk-iam-sasl-signer-js";

import type { KafkaConfig } from "./config/config.ts";

type MskAuth = NonNullable<KafkaConfig["mskAuth"]>;

export async function initKafka(
  config: KafkaConfig,
  logger: Logger,
): Promise<KafkaJS.Kafka> {
  const { mskAuth } = config;
  const saslConfigs: CommonConstructorConfig = mskAuth
    ? {
        oauthbearer_token_refresh_cb: async () => {
          const tokenResponse = await oauthBearerTokenProvider(mskAuth, logger);
          return {
            lifetime: tokenResponse.expiryTime,
            tokenValue: tokenResponse.token,
          };
        },
        "sasl.mechanism": "OAUTHBEARER",
        "security.protocol": "sasl_ssl",
      }
    : {};

  return new KafkaJS.Kafka({
    "bootstrap.servers": config.kafkaBrokers,
    "client.id": config.kafkaClientId,
    log_level: config.kafkaLogLevel,
    ...saslConfigs,
  });
}

async function oauthBearerTokenProvider(
  mskAuth: MskAuth,
  logger: Logger,
): Promise<GenerateAuthTokenResponse> {
  logger.debug("Fetching token from AWS");

  const authTokenResponse = await generateAuthTokenFromRole({
    awsRoleArn: mskAuth.awsRoleArn,
    awsRoleSessionName: mskAuth.awsRoleSessionName,
    region: mskAuth.awsRegion,
  });

  logger.debug(
    `Token fetched from AWS expires at ${authTokenResponse.expiryTime}`,
  );

  return authTokenResponse;
}
