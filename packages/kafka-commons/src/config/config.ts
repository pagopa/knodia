import { KafkaJS } from "@confluentinc/kafka-javascript";
import { z } from "zod";

const { logLevel } = KafkaJS;

export const KafkaConfig = z
  .object({
    AWS_REGION: z.string().optional(),
    KAFKA_BROKERS: z.string(),
    KAFKA_CLIENT_ID: z.string(),
    KAFKA_DISABLE_AWS_IAM_AUTH: z.stringbool().default(false),
    KAFKA_LOG_LEVEL: z
      .enum(["NOTHING", "ERROR", "WARN", "INFO", "DEBUG"])
      .default("INFO"),
    MSK_ROLE_ARN: z.string().optional(),
    POD_NAME: z.string().optional(),
  })
  .refine(
    (c) =>
      c.KAFKA_DISABLE_AWS_IAM_AUTH ||
      (c.AWS_REGION !== undefined && c.MSK_ROLE_ARN !== undefined),
    {
      message:
        "AWS_REGION and MSK_ROLE_ARN are required when IAM auth is enabled",
    },
  )
  .transform((c) => ({
    kafkaBrokers: c.KAFKA_BROKERS,
    kafkaClientId: c.KAFKA_CLIENT_ID,
    kafkaLogLevel: logLevel[c.KAFKA_LOG_LEVEL],
    mskAuth: c.KAFKA_DISABLE_AWS_IAM_AUTH
      ? undefined
      : {
          awsRegion: c.AWS_REGION as string,
          awsRoleArn: c.MSK_ROLE_ARN as string,
          awsRoleSessionName: c.POD_NAME ?? "kafka-commons-client",
        },
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

export const AgreementTopicConfig = z
  .object({
    AGREEMENT_TOPIC: z.string(),
  })
  .transform((c) => ({
    agreementTopic: c.AGREEMENT_TOPIC,
  }));
export type AgreementTopicConfig = z.infer<typeof AgreementTopicConfig>;

export const KeychainTopicConfig = z
  .object({
    KEYCHAIN_TOPIC: z.string(),
  })
  .transform((c) => ({
    keychainTopic: c.KEYCHAIN_TOPIC,
  }));
export type KeychainTopicConfig = z.infer<typeof KeychainTopicConfig>;

export const PurposeTopicConfig = z
  .object({
    PURPOSE_TOPIC: z.string(),
  })
  .transform((c) => ({
    purposeTopic: c.PURPOSE_TOPIC,
  }));
export type PurposeTopicConfig = z.infer<typeof PurposeTopicConfig>;

export const OrganizationTopicConfig = z
  .object({
    ORGANIZATION_TOPIC: z.string(),
  })
  .transform((c) => ({
    organizationTopic: c.ORGANIZATION_TOPIC,
  }));
export type OrganizationTopicConfig = z.infer<typeof OrganizationTopicConfig>;
