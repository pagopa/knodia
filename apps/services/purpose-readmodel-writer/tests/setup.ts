import type {
  TestConsumer,
  TestDrizzleDb,
  TestProducer,
} from "@knodia/test-commons/types";

import { readmodelPurpose } from "@knodia/db-readmodel-purpose";
import { setupKafkaTestProducerAndConsumer } from "@knodia/test-commons/kafka";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
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

beforeAll(async () => {
  readmodelDb = await setupReadmodelTestDatabase(
    inject("POSTGRES_CONNECTION_STRING"),
  );

  const { logger } = createTestLogger();
  ({ consumer, producer, topicName } = await setupKafkaTestProducerAndConsumer(
    inject("KAFKA_BROKER"),
    createProcessMessage(readmodelDb, logger),
  ));
});

afterEach(async () => {
  await resetTestDatabase(readmodelDb, readmodelPurpose);
});

afterAll(async () => {
  await Promise.all([
    readmodelDb.$client.end(),
    producer.disconnect(),
    consumer.disconnect(),
  ]);
});

export { consumer, producer, readmodelDb, topicName };
