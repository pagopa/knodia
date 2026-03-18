import type { KafkaConsumerConfig } from "@knodia/kafka-commons/config";

import { readmodelConsumerKeychain } from "@knodia/db-readmodel-keychain";
import { setupKafkaTestProducer } from "@knodia/test-commons/kafka";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { resetTestDatabase } from "@knodia/test-commons/utils";
import { createTestLogger } from "@knodia/test-commons/utils";
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
  await resetTestDatabase(readmodelDb, readmodelConsumerKeychain);
});

afterAll(async () => {
  await readmodelDb.$client.end();
  await producer.disconnect();
});

export { kafkaConfig, processMessage, producer, readmodelDb, topicName };
