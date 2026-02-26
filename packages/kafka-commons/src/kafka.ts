import type { CommonConstructorConfig } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { Logger } from "pino";

import { KafkaJS } from "@confluentinc/kafka-javascript";
import {
  generateAuthToken,
  type GenerateAuthTokenResponse,
} from "aws-msk-iam-sasl-signer-js";

import { KafkaConfig } from "./config/config.ts";

export async function initKafka(
  config: KafkaConfig,
  logger: Logger,
): Promise<KafkaJS.Kafka> {
  const saslConfigs: CommonConstructorConfig = config.kafkaDisableAwsIamAuth
    ? {}
    : {
        oauthbearer_token_refresh_cb: async () => {
          const tokenResponse = await oauthBearerTokenProvider(
            config.awsRegion,
            logger,
          );
          return {
            lifetime: tokenResponse.expiryTime,
            tokenValue: tokenResponse.token,
          };
        },
        "sasl.mechanism": "OAUTHBEARER",
        "security.protocol": "sasl_ssl",
      };

  return new KafkaJS.Kafka({
    "bootstrap.servers": config.kafkaBrokers,
    "client.id": config.kafkaClientId,
    log_level: config.kafkaLogLevel,
    ...saslConfigs,
  });
}

async function oauthBearerTokenProvider(
  region: string,
  logger: Logger,
): Promise<GenerateAuthTokenResponse> {
  logger.debug("Fetching token from AWS");

  const authTokenResponse = await generateAuthToken({
    region,
  });

  logger.debug(
    `Token fetched from AWS expires at ${authTokenResponse.expiryTime}`,
  );

  return authTokenResponse;
}
