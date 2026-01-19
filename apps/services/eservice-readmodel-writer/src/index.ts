import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.js";

// import { runConsumer } from "@knodia/kafka-commons";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { config } from "./config/config.ts";
import { handleEserviceEvent, parseEserviceEvent } from "./consumerService.ts";
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

// @ts-expect-error TS6133: processMessage is defined for future consumer wiring.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function processMessage({ message }: EachMessagePayload): Promise<void> {
  if (!message.value) {
    return;
  }

  const payload = message.value.toString();
  const event = parseEserviceEvent(payload);
  await handleEserviceEvent(event, eserviceWriterService);
}

// await runConsumer([config.eserviceTopic], processMessage, config);
