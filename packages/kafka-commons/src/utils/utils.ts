import type { KafkaMessage } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { Logger } from "pino";
import type z from "zod";

import {
  genericInternalError,
  missingKafkaMessageDataError,
} from "@knodia/common-models/errors";
import {
  type EventSchema,
  KafkaMessageEnvelope,
} from "@knodia/common-models/event";

export function assertDataExistsInEvent<
  TEventZodType extends EventSchema,
  K extends string,
>(
  message: z.infer<TEventZodType>,
  key: K,
): asserts message is z.infer<TEventZodType> & {
  data: Record<K, NonNullable<unknown>>;
} {
  function isPlainObject(obj: unknown): obj is Record<string, unknown> {
    return obj !== null && Object.getPrototypeOf(obj) === Object.prototype;
  }

  if (!isPlainObject(message.data)) {
    throw genericInternalError(
      `Expected event data to be an object, got ${typeof message.data}`,
    );
  }

  if (!(key in message.data) || message.data[key] == null) {
    throw missingKafkaMessageDataError(key, message.type);
  }
}

/**
 * Decodes a plain-JSON Kafka message (not an event-store Debezium envelope with
 * Protobuf data) and validates it against the provided Zod schema. Used by
 * consumers of non-event-sourced topics (e.g. signup events).
 *
 * @param {KafkaMessage} message - The Kafka message to decode.
 * @throws {Error} - If the value is missing or fails schema validation.
 */
export function decodeKafkaJsonMessage<TSchema extends z.ZodType>(
  message: KafkaMessage,
  schema: TSchema,
): z.infer<TSchema> {
  try {
    return schema.parse(JSON.parse(message.value?.toString() ?? ""));
  } catch (error) {
    throw new Error(
      `Invalid Kafka JSON message: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

/**
 * Decodes a Kafka message using the provided event schema.
 *
 * @param {KafkaMessage} message - The Kafka message to decode.
 * @throws {Error} - If the message is invalid or missing required data.
 */
export function decodeKafkaMessageEvent<TEvent extends EventSchema>(
  message: KafkaMessage,
  event: TEvent,
) {
  try {
    return KafkaMessageEnvelope(event).decode(message);
  } catch (error) {
    throw new Error(
      `Invalid message: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

export async function processExitAndDisconnect({
  logger,
  onShutdown,
}: {
  logger: Logger;
  onShutdown?: () => Promise<void>;
}) {
  if (onShutdown) {
    await onShutdown();
    logger.debug("Shutdown hook completed successfully");
  }

  processExit({ logger });
}

function processExit({
  exitStatusCode = 1,
  logger,
}: {
  exitStatusCode?: number;
  logger: Logger;
}): never {
  logger.debug(`Process exit with code ${exitStatusCode}`);
  process.exit(exitStatusCode);
}
