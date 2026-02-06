import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.js";

import { KafkaJS } from "@confluentinc/kafka-javascript";

import { KafkaConfig, KafkaConsumerConfig } from "../config/config.ts";

export async function runConsumer(
  topics: string[],
  consumerHandler: (messagePayload: EachMessagePayload) => Promise<void>,
  config: KafkaConsumerConfig,
) {
  const kafka = initKafka(config);

  await createTopics(kafka, topics);

  const consumer = kafka.consumer({
    "auto.offset.reset": config.topicStartingOffset,
    "group.id": config.kafkaGroupId,
  });

  await consumer.connect();
  await consumer.subscribe({ topics });
  await consumer.run({ eachMessage: consumerHandler });
}

async function createTopics(kafka: KafkaJS.Kafka, topics: string[]) {
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({ topics: topics.map((topic) => ({ topic })) });
  await admin.disconnect();
}

function initKafka(config: KafkaConfig): KafkaJS.Kafka {
  return new KafkaJS.Kafka({
    "bootstrap.servers": config.kafkaBrokers,
    "client.id": config.kafkaClientId,
    log_level: config.kafkaLogLevel,
  });
}
