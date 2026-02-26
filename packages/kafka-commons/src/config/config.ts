import { KafkaJS } from "@confluentinc/kafka-javascript";
import { z } from "zod";

const { logLevel } = KafkaJS;

export const KafkaConfig = z
  .object({
    AWS_REGION: z.string(),
    KAFKA_BROKERS: z.string(),
    KAFKA_CLIENT_ID: z.string(),
    KAFKA_DISABLE_AWS_IAM_AUTH: z.stringbool().default(false),
    KAFKA_LOG_LEVEL: z
      .enum(["NOTHING", "ERROR", "WARN", "INFO", "DEBUG"])
      .default("INFO"),
  })
  .transform((c) => ({
    awsRegion: c.AWS_REGION,
    kafkaBrokers: c.KAFKA_BROKERS,
    kafkaClientId: c.KAFKA_CLIENT_ID,
    kafkaDisableAwsIamAuth: c.KAFKA_DISABLE_AWS_IAM_AUTH,
    kafkaLogLevel: logLevel[c.KAFKA_LOG_LEVEL],
  }));
export type KafkaConfig = z.infer<typeof KafkaConfig>;

export const KafkaConsumerConfig = KafkaConfig.and(
  z
    .object({
      KAFKA_GROUP_ID: z.string(),
      TOPIC_STARTING_OFFSET: z
        .union([z.literal("earliest"), z.literal("latest")])
        .default("latest"),
    })
    .transform((c) => ({
      kafkaGroupId: c.KAFKA_GROUP_ID,
      topicStartingOffset: c.TOPIC_STARTING_OFFSET,
    })),
);
export type KafkaConsumerConfig = z.infer<typeof KafkaConsumerConfig>;

export const EserviceTopicConfig = z
  .object({
    ESERVICE_TOPIC: z.string(),
  })
  .transform((c) => ({
    eserviceTopic: c.ESERVICE_TOPIC,
  }));
export type EserviceTopicConfig = z.infer<typeof EserviceTopicConfig>;

export const KeychainTopicConfig = z
  .object({
    KEYCHAIN_TOPIC: z.string(),
  })
  .transform((c) => ({
    keychainTopic: c.KEYCHAIN_TOPIC,
  }));
export type KeychainTopicConfig = z.infer<typeof KeychainTopicConfig>;
