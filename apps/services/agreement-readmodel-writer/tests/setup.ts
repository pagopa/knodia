import { readmodelAgreement } from "@knodia/db-readmodel-agreement";
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
  await resetTestDatabase(readmodelDb, readmodelAgreement);
});

afterAll(async () => {
  await readmodelDb.$client.end();
  await producer.disconnect();
});

export { consumer, producer, readmodelDb, topicName };
