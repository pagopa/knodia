import { readmodelConsumerKeychain } from "@knodia/db-readmodel-keychain";
import {
  type ConsumerKeychainWriterService,
  consumerKeychainWriterServiceBuilder,
} from "@knodia/db-readmodel-keychain/services";
import { setupKafkaTestProducerAndConsumer } from "@knodia/test-commons/kafka";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import {
  type TestConsumer,
  type TestDrizzleDb,
  type TestProducer,
} from "@knodia/test-commons/types";
import {
  createTestLogger,
  resetTestDatabase,
} from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { createProcessMessage } from "../src/utils/utils.ts";

let readmodelDb: TestDrizzleDb;
let producer: TestProducer;
let consumer: TestConsumer;
let topicName: string;
let keychainWriterService: ConsumerKeychainWriterService;

beforeAll(async () => {
  readmodelDb = await setupReadmodelTestDatabase(
    inject("POSTGRES_CONNECTION_STRING"),
  );

  const { logger } = createTestLogger();

  ({ consumer, producer, topicName } = await setupKafkaTestProducerAndConsumer(
    inject("KAFKA_BROKER"),
    createProcessMessage(readmodelDb, logger),
  ));

  keychainWriterService = consumerKeychainWriterServiceBuilder(readmodelDb);
});

afterEach(async () => {
  await resetTestDatabase(readmodelDb, readmodelConsumerKeychain);
});

afterAll(async () => {
  await Promise.all([
    readmodelDb.$client.end(),
    producer.disconnect(),
    consumer.disconnect(),
  ]);
});

export { consumer, keychainWriterService, producer, readmodelDb, topicName };
