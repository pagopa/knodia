import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.js";

import { EserviceEventV1 } from "@knodia/eservice-models";
import { runConsumer } from "@knodia/kafka-commons";
import { decodeKafkaMessageEvent } from "@knodia/kafka-commons/utils";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { config } from "./config/config.ts";
import { handleEserviceEvent } from "./consumerService.ts";
import { eserviceWriterServiceBuilder } from "./eserviceWriterService.ts";

const pool = new Pool({
  database: config.readModelDbName,
  host: config.readModelDbHost,
  password: config.readModelDbPassword,
  port: config.readModelDbPort,
  ssl: config.readModelDbUseSsl ? { rejectUnauthorized: false } : undefined,
  user: config.readModelDbUser,
});

const db = drizzle(pool);

const eserviceWriterService = eserviceWriterServiceBuilder(db);

async function processMessage({ message }: EachMessagePayload): Promise<void> {
  const event = decodeKafkaMessageEvent(message, EserviceEventV1);

  console.log("Processing event:", {
    event,
  });

  await handleEserviceEvent(event, eserviceWriterService);
}

await runConsumer([config.eserviceTopic], processMessage, config);
