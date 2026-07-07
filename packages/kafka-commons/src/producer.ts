import type {
  Kafka,
  Producer,
} from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { Logger } from "pino";

import type { KafkaConfig } from "./config/config.ts";

import { checkTopicsExist } from "./admin.ts";
import { initKafka } from "./kafka.ts";
import { errorEventsListener } from "./listeners.ts";

/**
 * Producer librdkafka defaults restored after KafkaJS-compat mode overrides them (see
 * kafka.ts). consistent_random keeps the historical key→partition mapping, so a mixed
 * old/new deploy doesn't split a key's stream and break per-key ordering (signup relies
 * on it). Always create producers through this helper, never `kafka.producer()` directly.
 */
export function createKafkaProducer(kafka: Kafka): Producer {
  return kafka.producer({
    partitioner: "consistent_random",
    retries: 2147483647,
  });
}

export async function createProducer(
  topics: string[],
  config: KafkaConfig,
  logger: Logger,
  onShutdown?: () => Promise<void>,
): Promise<Producer> {
  logger.debug(`Kafka producer connecting to topics: ${topics}`);

  const kafka = await initKafka(config, logger);

  const producer = createKafkaProducer(kafka);

  errorEventsListener(producer, logger, onShutdown);

  await producer.connect();
  logger.debug("Kafka producer connected");

  const topicExists = await checkTopicsExist(kafka, topics, logger);
  if (!topicExists) {
    await producer.disconnect();
    throw new Error(`Unable to produce to topics: ${topics}`);
  }

  logger.info(`Kafka producer ready for topics: ${topics}`);

  return producer;
}
