import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type {
  KafkaConfig,
  KafkaConsumerConfig,
} from "@knodia/kafka-commons/config";

import { KafkaJS } from "@confluentinc/kafka-javascript";
import { generateId } from "@knodia/common-models/ids";
import { initKafka, runConsumer } from "@knodia/kafka-commons";
import { KafkaContainer } from "@testcontainers/kafka";
import { Pool } from "pg";

import { createTestLogger } from "../utils/logger.ts";

const { logLevel } = KafkaJS;

const TEST_KAFKA_PORT = 9093;
const TEST_KAFKA_IMAGE = "confluentinc/cp-kafka:8.1.1";
const AWS_REGION = "eu-south-1";

const { logger } = createTestLogger();

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

  const kafkaCommonConfig: Omit<KafkaConfig, "kafkaClientId"> = {
    awsRegion: AWS_REGION,
    kafkaBrokers: broker,
    kafkaDisableAwsIamAuth: true,
    kafkaLogLevel: logLevel.INFO,
  };
  const kafka = await initKafka(
    {
      kafkaClientId: `test-client-${randomId}`,
      ...kafkaCommonConfig,
    },
    logger,
  );

  const producer = kafka.producer({
    "allow.auto.create.topics": true,
  });

  await producer.connect();

  const kafkaConfig: KafkaConsumerConfig = {
    kafkaClientId: `test-consumer-client-${randomId}`,
    kafkaGroupId: `test-consumer-group-${randomId}`,
    topicStartingOffset: "earliest",
    ...kafkaCommonConfig,
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
      logger,
      // Dummy pool, not used in tests. The real Pool instance is closed in the test files' afterAll hooks.
      new Pool({ connectionString: "" }),
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
