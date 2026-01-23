import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.js";

import { runConsumer } from "@knodia/kafka-commons";
import { decodeKafkaMessage } from "@knodia/kafka-commons/utils";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { config } from "./config/config.ts";
import {
  EserviceEventEnvelope,
  handleEserviceEvent,
} from "./consumerService.ts";
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
  const event = decodeKafkaMessage(message);

  console.log("Processing event:", {
    event,
  });

  await handleEserviceEvent(
    // TODO: remove the cast after adding proper typings and models
    event as unknown as EserviceEventEnvelope,
    eserviceWriterService,
  );
}

await runConsumer([config.eserviceTopic], processMessage, config);
