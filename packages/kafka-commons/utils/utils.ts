import type { KafkaMessage } from "@confluentinc/kafka-javascript/types/kafkajs.js";
import type { ZodType } from "zod";

import { KafkaMessageEnvelope } from "@knodia/common-models/event";
/**
 * Decodes a Kafka message using the provided event schema.
 *
 * @param {KafkaMessage} message - The Kafka message to decode.
 * @throws {Error} - If the message is invalid or missing required data.
 */
export function decodeKafkaMessage<TEvent extends ZodType>(
  message: KafkaMessage,
  event: TEvent,
) {
  try {
    return KafkaMessageEnvelope(event).decode(message);
  } catch (error) {
    throw new Error("Invalid message: " + JSON.stringify(error));
  }
}
