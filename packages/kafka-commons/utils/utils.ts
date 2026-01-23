import type { KafkaMessage } from "@confluentinc/kafka-javascript/types/kafkajs.js";

import { z } from "zod";

// TODO: move to shared module package
export const EventEnvelope = <TEventZodType extends z.ZodType>(
  event: TEventZodType,
) =>
  z.intersection(
    z.object({
      correlation_id: z.string().nullish(),
      log_date: z.coerce.date(),
      sequence_num: z.number(),
      stream_id: z.uuid(),
      version: z.number(),
    }),
    event,
  );
export type EventEnvelope<TEvent> = z.infer<
  ReturnType<typeof EventEnvelope<z.ZodType<TEvent>>>
>;

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
