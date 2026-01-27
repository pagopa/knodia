import type { KafkaMessage } from "@confluentinc/kafka-javascript/types/kafkajs.js";
import type { EventEnvelope } from "@knodia/common-models/event";
/**
 * Decodes a Kafka message using the provided event schema.
 *
 * @param {KafkaMessage} message - The Kafka message to decode.
 * @throws {Error} - If the message is invalid or missing required data.
 */
export function decodeKafkaMessage<TEvent>(
  message: KafkaMessage,
): EventEnvelope<TEvent> {
  try {
    const value = message.value;
    const parsedValue = JSON.parse(value?.toString() ?? "");
    const decoded = parsedValue.after;
    // TODO: decode protobuf data
    return decoded;
  } catch (error) {
    throw new Error("Invalid message: " + JSON.stringify(error));
  }
}
