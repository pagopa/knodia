import type { KafkaMessage } from "@confluentinc/kafka-javascript/types/kafkajs.js";
import type z from "zod";

import { EventEnvelope } from "@knodia/common-models/event";
/**
 * Decodes a Kafka message using the provided event schema.
 *
 * @param {KafkaMessage} message - The Kafka message to decode.
 * @throws {Error} - If the message is invalid or missing required data.
 */
export function decodeKafkaMessage<TEvent extends z.ZodType>(
  message: KafkaMessage,
  event: TEvent,
) {
  try {
    // TODO create a unique zod decoder for message value etc. as in PDND
    const value = message.value;
    const parsedValue = JSON.parse(value?.toString() ?? "").after;

    const decoded = EventEnvelope(event).decode(parsedValue);
    return decoded;
  } catch (error) {
    throw new Error("Invalid message: " + JSON.stringify(error));
  }
}
