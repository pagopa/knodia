import type { KafkaConsumerConfig } from "@knodia/kafka-commons/config";

import { readmodelAgreement } from "@knodia/db-readmodel-agreement";
import { setupKafkaTestProducer } from "@knodia/test-commons/kafka";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import {
  createTestLogger,
  resetTestDatabase,
} from "@knodia/test-commons/utils";
import { afterAll, afterEach, beforeAll, inject } from "vitest";

import { createProcessMessage } from "../src/utils/utils.ts";

let readmodelDb: Awaited<ReturnType<typeof setupReadmodelTestDatabase>>;
let producer: Awaited<ReturnType<typeof setupKafkaTestProducer>>["producer"];
let topicName: Awaited<ReturnType<typeof setupKafkaTestProducer>>["topicName"];
let kafkaConfig: KafkaConsumerConfig;
let processMessage: ReturnType<typeof createProcessMessage>;

beforeAll(async () => {
  readmodelDb = await setupReadmodelTestDatabase(
    inject("POSTGRES_CONNECTION_STRING"),
  );

  ({ kafkaConfig, producer, topicName } = await setupKafkaTestProducer(
    inject("KAFKA_BROKER"),
  ));

  const { logger } = createTestLogger();
  processMessage = createProcessMessage(readmodelDb, logger);
});

afterEach(async () => {
  await resetTestDatabase(readmodelDb, readmodelAgreement);
});

afterAll(async () => {
  await readmodelDb.$client.end();
  await producer.disconnect();
});

export { kafkaConfig, processMessage, producer, readmodelDb, topicName };
