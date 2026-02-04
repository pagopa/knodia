import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.js";

import { readmodelEservice } from "@knodia/db-readmodel-eservice";

import { consumedMessages, processMessage, readmodelDb } from "./setup.ts";

export async function getAllEservices() {
  return await readmodelDb.select().from(readmodelEservice);
}

export const testConsumerHandler = async (payload: EachMessagePayload) => {
  consumedMessages.push(payload);
  await processMessage(payload);
};
