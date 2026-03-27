import type { NodePgDatabase } from "drizzle-orm/node-postgres/driver";
import type { Pool } from "pg";

import type { setupKafkaTestProducerAndConsumer } from "../testcontainers/kafka.ts";

export type TestConsumer = Awaited<
  ReturnType<typeof setupKafkaTestProducerAndConsumer>
>["consumer"];

export type TestDrizzleDb = NodePgDatabase<Record<string, never>> & {
  $client: Pool;
};

export type TestProducer = Awaited<
  ReturnType<typeof setupKafkaTestProducerAndConsumer>
>["producer"];
