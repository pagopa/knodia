import {
  readmodelConsumerKeychain,
  readmodelKnodeApiKeychain,
} from "@knodia/db-readmodel-keychain";
import {
  type ConsumerKeychainWriterService,
  consumerKeychainWriterServiceBuilder,
  type KnodeApiKeychainWriterService,
  knodeApiKeychainWriterServiceBuilder,
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
let consumerKeychainWriterService: ConsumerKeychainWriterService;
let knodeApiKeychainWriterService: KnodeApiKeychainWriterService;

beforeAll(async () => {
  readmodelDb = await setupReadmodelTestDatabase(
    inject("POSTGRES_CONNECTION_STRING"),
  );

  const { logger } = createTestLogger();

  ({ consumer, producer, topicName } = await setupKafkaTestProducerAndConsumer(
    inject("KAFKA_BROKER"),
    createProcessMessage(readmodelDb, logger),
  ));

  consumerKeychainWriterService =
    consumerKeychainWriterServiceBuilder(readmodelDb);
  knodeApiKeychainWriterService =
    knodeApiKeychainWriterServiceBuilder(readmodelDb);
});

afterEach(async () => {
  await resetTestDatabase(
    readmodelDb,
    readmodelConsumerKeychain,
    readmodelKnodeApiKeychain,
  );
});

afterAll(async () => {
  await Promise.all([
    readmodelDb.$client.end(),
    producer.disconnect(),
    consumer.disconnect(),
  ]);
});

export {
  consumer,
  consumerKeychainWriterService,
  knodeApiKeychainWriterService,
  producer,
  readmodelDb,
  topicName,
};
