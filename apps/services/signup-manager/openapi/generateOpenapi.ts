import type { Producer } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import generateOpenapi from "@knodia/fastify-zod-api-commons/generateOpenapi";

import { buildApp } from "../src/app.ts";
import { config } from "../src/config/config.ts";

await generateOpenapi(
  buildApp({
    config,
    kafkaProducer: {} as Producer,
    signupDb: {} as NodePgDatabase,
  }),
);
