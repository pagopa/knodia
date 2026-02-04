import type { KafkaConsumerConfig } from "@knodia/kafka-commons/config";

import { KafkaJS } from "@confluentinc/kafka-javascript";
import { initKafka } from "@knodia/kafka-commons";
import { KafkaContainer } from "@testcontainers/kafka";

const { logLevel } = KafkaJS;

const KAFKA_PORT = 9093;

export async function setupKafkaTestContainer() {
  const container = await new KafkaContainer("confluentinc/cp-kafka:7.6.9")
    .withKraft()
    .withExposedPorts()
    .withReuse()
    .start();

  const mappedPort = container.getMappedPort(KAFKA_PORT);
  const host = container.getHost();
  const broker = `${host}:${mappedPort}`;

  return { broker, container };
}
/**
 * Creates a dedicated database for a single test file by cloning the template.
 * It generates a unique DB name, creates it using TEMPLATE, and returns a Drizzle connection.
 *
 * Intended to be called in beforeAll of each test file.
 */
export async function setupKafkaTestProducer(broker: string) {
  const randomId = crypto.randomUUID();
  const topicName = `test_kafka_topic_worker_${randomId}`;

  const kafka = await initKafka({
    kafkaBrokers: broker,
    kafkaClientId: `test-client-${randomId}`,
    kafkaLogLevel: logLevel.INFO,
  });
  const producer = kafka.producer({
    "allow.auto.create.topics": true,
  });

  await producer.connect();

  const kafkaConfig: KafkaConsumerConfig = {
    kafkaBrokers: broker,
    kafkaClientId: `test-consumer-client-${randomId}`,
    kafkaGroupId: `test-consumer-group-${randomId}`,
    kafkaLogLevel: logLevel.INFO,
    topicStartingOffset: "earliest",
  };

  return { kafkaConfig, producer, topicName };
}

declare module "vitest" {
  export interface ProvidedContext {
    KAFKA_BROKER: string;
  }
}

export async function sendTestEvent({
  data,
  eventType,
  metadataVersion,
  producer,
  streamId,
  topicName,
}: {
  data: Uint8Array;
  eventType: string;
  metadataVersion?: number;
  producer: KafkaJS.Producer;
  streamId: string;
  topicName: string;
}) {
  const message = {
    after: {
      correlation_id: crypto.randomUUID(),
      data: Buffer.from(data).toString("hex"),
      log_date: new Date(),
      sequence_num: 1,
      stream_id: streamId,
      type: eventType,
      version: metadataVersion ?? 0,
    },
  };

  await producer.send({
    messages: [
      {
        value: JSON.stringify(message),
      },
    ],
    topic: topicName,
  });
}
