import type {
  EachMessagePayload,
  ProducerRecord,
  RecordMetadata,
} from "@confluentinc/kafka-javascript/types/kafkajs.js";

import { KafkaJS } from "@confluentinc/kafka-javascript";

import {
  config as defaultKafkaConfig,
  consumerConfig as defaultKafkaConsumerConfig,
  KafkaConfig,
  KafkaConsumerConfig,
} from "./config/config.ts";

export async function runAdminClient(config?: KafkaConfig) {
  const kafka = await initKafka(config);

  const admin = kafka.admin();
  await admin.connect();

  return admin;
}

export async function runConsumer(
  topics: string[],
  consumerHandler: (messagePayload: EachMessagePayload) => Promise<void>,
  config: KafkaConsumerConfig = defaultKafkaConsumerConfig,
) {
  const kafka = await initKafka(config);

  const consumer = kafka.consumer({
    "auto.offset.reset": "earliest",
    "group.id": config.kafkaGroupId,
  });

  await consumer.connect();
  await consumer.subscribe({ topics });

  await consumer.run({
    eachMessage: consumerHandler,
  });
}

export async function runProducer(
  topic: string,
  config?: KafkaConfig,
): Promise<
  KafkaJS.Producer & {
    send: (record: Omit<ProducerRecord, "topic">) => Promise<RecordMetadata[]>;
  }
> {
  const kafka = await initKafka(config);

  const producer = kafka.producer({
    "allow.auto.create.topics": true,
  });

  await producer.connect();

  return {
    ...producer,
    send: async (record: Omit<ProducerRecord, "topic">) =>
      await producer.send({
        ...record,
        topic,
      }),
  };
}

async function initKafka(
  config: KafkaConfig = defaultKafkaConfig,
): Promise<KafkaJS.Kafka> {
  return new KafkaJS.Kafka({
    "bootstrap.servers": config.kafkaBrokers,
    log_level: config.kafkaLogLevel,
  });
}
