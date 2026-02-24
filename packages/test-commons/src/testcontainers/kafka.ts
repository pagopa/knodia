import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.js";
import type { KafkaConsumerConfig } from "@knodia/kafka-commons/config";

import { KafkaJS } from "@confluentinc/kafka-javascript";
import { generateId } from "@knodia/common-models/ids";
import { initKafka, runConsumer } from "@knodia/kafka-commons";
import { KafkaContainer } from "@testcontainers/kafka";

const { logLevel } = KafkaJS;

const TEST_KAFKA_PORT = 9093;
const TEST_KAFKA_IMAGE = "confluentinc/cp-kafka:8.1.1";

/**
 * !!! Intended to be called once in global test setup !!!
 *
 *  Starts the shared Kafka test container.
 *  It returns the broker address to be used by test files.
 */
export async function setupKafkaTestContainer() {
  const container = await new KafkaContainer(TEST_KAFKA_IMAGE)
    .withKraft()
    .withExposedPorts()
    .withReuse()
    .start();

  const mappedPort = container.getMappedPort(TEST_KAFKA_PORT);
  const host = container.getHost();
  const broker = `${host}:${mappedPort}`;

  return { broker, container };
}
/**
 * Creates a dedicated Kafka topic for a single test file by using the test container broker.
 * It returns the Kafka configuration, producer, and topic name.
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

export async function runTestConsumer(
  topicName: string,
  processMessage: (readmodelDb: EachMessagePayload) => Promise<void>,
  kafkaConfig: KafkaConsumerConfig,
) {
  await new Promise<void>((resolve, reject) => {
    runConsumer(
      [topicName],
      async (payload) => {
        try {
          await processMessage(payload);
          resolve();
        } catch (err) {
          reject(err);
        }
      },
      kafkaConfig,
    );
  });
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
      correlation_id: generateId(),
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
