import { readmodelConsumerKeychain } from "@knodia/db-readmodel-keychain";
import {
  type ConsumerKeychainReadmodelService,
  consumerKeychainReadmodelServiceBuilder,
} from "@knodia/db-readmodel-keychain/services";
import {
  type KeychainWriterService,
  keychainWriterServiceBuilder,
} from "@knodia/db-readmodel-keychain/writer";
import { setupKafkaTestProducerAndConsumer } from "@knodia/test-commons/kafka";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import {
  createTestLogger,
  resetTestDatabase,
} from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { createProcessMessage } from "../src/utils/utils.ts";

let readmodelDb: Awaited<ReturnType<typeof setupReadmodelTestDatabase>>;
let producer: Awaited<
  ReturnType<typeof setupKafkaTestProducerAndConsumer>
>["producer"];
let consumer: Awaited<
  ReturnType<typeof setupKafkaTestProducerAndConsumer>
>["consumer"];
let topicName: Awaited<
  ReturnType<typeof setupKafkaTestProducerAndConsumer>
>["topicName"];
let keychainWriterService: KeychainWriterService;
let consumerKeychainReadmodelService: ConsumerKeychainReadmodelService;

beforeAll(async () => {
  readmodelDb = await setupReadmodelTestDatabase(
    inject("POSTGRES_CONNECTION_STRING"),
  );

  const { logger } = createTestLogger();

  ({ consumer, producer, topicName } = await setupKafkaTestProducerAndConsumer(
    inject("KAFKA_BROKER"),
    createProcessMessage(readmodelDb, logger),
  ));

  keychainWriterService = keychainWriterServiceBuilder(readmodelDb);
  consumerKeychainReadmodelService =
    consumerKeychainReadmodelServiceBuilder(readmodelDb);
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

export {
  consumer,
  consumerKeychainReadmodelService,
  keychainWriterService,
  producer,
  readmodelDb,
  topicName,
};
