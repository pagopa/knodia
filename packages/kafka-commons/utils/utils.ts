import type { KafkaMessage } from "@confluentinc/kafka-javascript/types/kafkajs.js";

import { kafkaMessageEnvelope } from "@knodia/common-models/event";
import { z } from "zod";

/**
 * Decodes a Kafka message using the provided event schema.
 *
 * @param {KafkaMessage} message - The Kafka message to decode.
 * @throws {Error} - If the message is invalid or missing required data.
 */
export function decodeKafkaMessageEvent<TEvent extends z.ZodType>(
  message: KafkaMessage,
  event: TEvent,
) {
  try {
    return kafkaMessageEnvelope(event).decode(message);
  } catch (error) {
    throw new Error("Invalid message: " + JSON.stringify(error));
  }
}
