import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { KafkaConsumerLoggerMetadata } from "@knodia/logger/models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Logger } from "pino";

import { unsafeBrandId } from "@knodia/common-models/ids";
/* eslint-disable no-restricted-imports */
import { keychainWriterBuilder } from "@knodia/db-readmodel-keychain/writer";
import { decodeKafkaMessageEvent } from "@knodia/kafka-commons/utils";
import { KeychainEventV1 } from "@knodia/keychain-models";

import { handleKeychainEvent } from "../services/consumerService.ts";

export const createProcessMessage = (
  readmodelDb: NodePgDatabase,
  logger: Logger,
) => {
  const keychainWriterService = keychainWriterBuilder(readmodelDb);

  return async function processMessage({
    message,
    partition,
  }: EachMessagePayload) {
    const event = decodeKafkaMessageEvent(message, KeychainEventV1);

    const loggerMetadata: KafkaConsumerLoggerMetadata = {
      correlationId: unsafeBrandId(event.correlation_id),
      eventType: event.type,
      eventVersion: event.version,
      streamId: event.stream_id,
      streamVersion: event.version,
    };
    const messageLogger = logger.child(loggerMetadata);

    await handleKeychainEvent(event, { keychainWriterService });

    messageLogger.info(
      `Read model was updated. Partition number: ${partition}. Offset: ${message.offset}`,
    );
  };
};
