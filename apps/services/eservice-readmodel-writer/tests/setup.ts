import type { KafkaConsumerConfig } from "@knodia/kafka-commons/config";

import { setupKafkaTestProducer } from "@knodia/test-commons/kafka";
import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { afterAll, afterEach, beforeAll, beforeEach, inject } from "vitest";

import { createProcessMessage } from "../src/utilities/utils.ts";

let readModelDb: Awaited<ReturnType<typeof setupReadmodelTestDatabase>>;
let producer: Awaited<ReturnType<typeof setupKafkaTestProducer>>["producer"];
let topicName: Awaited<ReturnType<typeof setupKafkaTestProducer>>["topicName"];
let kafkaConfig: KafkaConsumerConfig;
let processMessage: ReturnType<typeof createProcessMessage>;

beforeAll(async () => {
  readModelDb = await setupReadmodelTestDatabase(
    inject("READMODEL_CONNECTION_STRING"),
  );

  ({ kafkaConfig, producer, topicName } = await setupKafkaTestProducer(
    inject("KAFKA_BROKER"),
  ));

  processMessage = createProcessMessage(readModelDb);
});

beforeEach(async () => {
  await readModelDb.execute("BEGIN");
});

afterEach(async () => {
  await readModelDb.execute("ROLLBACK");
});

afterAll(async () => {
  await readModelDb.$client.end();
  await producer.disconnect();
});

export { kafkaConfig, processMessage, producer, readModelDb, topicName };
