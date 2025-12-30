import { KafkaJS } from "@confluentinc/kafka-javascript";
import { env } from "node:process";
import { z } from "zod";

const { logLevel } = KafkaJS;

export const KafkaConfig = z
  .object({
    KAFKA_BROKERS: z.string().transform((value) => value.split(",")),
    KAFKA_GROUP_ID: z.string(),
    KAFKA_LOG_LEVEL: z
      .enum(["NOTHING", "ERROR", "WARN", "INFO", "DEBUG"])
      .default("INFO"),
  })
  .transform((c) => ({
    kafkaBrokers: c.KAFKA_BROKERS,
    kafkaGroupId: c.KAFKA_GROUP_ID,
    kafkaLogLevel: logLevel[c.KAFKA_LOG_LEVEL],
  }));
export type KafkaConfig = z.infer<typeof KafkaConfig>;

export const KafkaConsumerConfig = KafkaConfig.and(
  z
    .object({
      KAFKA_GROUP_ID: z.string(),
    })
    .transform((c) => ({
      kafkaGroupId: c.KAFKA_GROUP_ID,
    })),
);
export type KafkaConsumerConfig = z.infer<typeof KafkaConsumerConfig>;

export const config = KafkaConfig.parse(env);
export const consumerConfig = KafkaConsumerConfig.parse(env);
