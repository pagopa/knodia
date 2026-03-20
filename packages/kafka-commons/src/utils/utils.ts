import type { KafkaMessage } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { Pool } from "pg";
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
    throw new Error("Invalid message: " + JSON.stringify(error));
  }
}

export async function processExitAndDisconnect({
  logger,
  readmodelPool,
}: {
  logger: Logger;
  readmodelPool: Pool;
}) {
  await readmodelPool.end();
  logger.debug("Readmodel pool closed successfully");

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
