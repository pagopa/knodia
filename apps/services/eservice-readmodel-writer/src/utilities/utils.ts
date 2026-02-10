import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { EserviceEventV1 } from "@knodia/eservice-models";
import { decodeKafkaMessageEvent } from "@knodia/kafka-commons/utils";

import { handleEserviceEvent } from "../services/consumerService.ts";
import { eserviceWriterServiceBuilder } from "../services/eserviceWriterService.ts";

export const createProcessMessage = (readmodelDb: NodePgDatabase) => {
  const eserviceWriterService = eserviceWriterServiceBuilder(readmodelDb);

  return async function processMessage({ message }: EachMessagePayload) {
    const event = decodeKafkaMessageEvent(message, EserviceEventV1);

    console.log("Processing event:", {
      event,
    });

    await handleEserviceEvent(event, eserviceWriterService);
  };
};
