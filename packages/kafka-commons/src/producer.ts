import type { Producer } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { Logger } from "pino";

import type { KafkaConfig } from "./config/config.ts";

import { checkTopicsExist } from "./admin.ts";
import { initKafka } from "./kafka.ts";
import { errorEventsListener } from "./listeners.ts";

export async function createProducer(
  topics: string[],
  config: KafkaConfig,
  logger: Logger,
  onShutdown?: () => Promise<void>,
): Promise<Producer> {
  logger.debug(`Kafka producer connecting to topics: ${topics}`);

  const kafka = await initKafka(config, logger);

  const producer = kafka.producer();

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
