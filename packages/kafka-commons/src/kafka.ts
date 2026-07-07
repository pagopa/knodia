import type { CommonConstructorConfig } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { Logger } from "pino";

import { KafkaJS } from "@confluentinc/kafka-javascript";
import {
  generateAuthTokenFromRole,
  type GenerateAuthTokenResponse,
} from "aws-msk-iam-sasl-signer-js";

import type { KafkaConfig } from "./config/config.ts";

import { pinoKafkaLogger } from "./utils/kafkaLogger.ts";

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

  // The kafkaJS block routes the client's logs through pino (KN-869) but switches the
  // client into KafkaJS-compat mode, which overrides some librdkafka defaults. We restore
  // them to keep this log-only: the common ones here, producer/consumer-specific ones in
  // their files. SASL stays librdkafka-flat (no kafkaJS form for the MSK callback).
  return new KafkaJS.Kafka({
    kafkaJS: {
      brokers: config.kafkaBrokers.split(",").map((b) => b.trim()),
      clientId: config.kafkaClientId,
      logger: pinoKafkaLogger(logger),
      logLevel: config.kafkaLogLevel,
    },
    "retry.backoff.max.ms": 1000,
    "retry.backoff.ms": 100,
    "socket.connection.setup.timeout.ms": 30000,
    "socket.timeout.ms": 60000,
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
