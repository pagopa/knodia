import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.js";
import type { LoggerConfig } from "@knodia/logger/config";
import type { KafkaConsumerLoggerMetadata } from "@knodia/logger/models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { unsafeBrandId } from "@knodia/common-models/ids";
import { keychainWriterServiceBuilder } from "@knodia/db-readmodel-keychain/writer";
import { decodeKafkaMessageEvent } from "@knodia/kafka-commons/utils";
import { KeychainEventV1 } from "@knodia/keychain-models";
import { createLogger } from "@knodia/logger";

import { handleKeychainEvent } from "../services/consumerService.ts";

export const createProcessMessage = (
  readmodelDb: NodePgDatabase,
  loggerConfig: LoggerConfig,
) => {
  const keychainWriterService = keychainWriterServiceBuilder(readmodelDb);

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
    const logger = createLogger({
      config: loggerConfig,
      loggerMetadata,
      serviceName: "keychain-readmodel-writer",
    });

    await handleKeychainEvent(event, keychainWriterService);

    logger.info(
      `Read model was updated. Partition number: ${partition}. Offset: ${message.offset}`,
    );
  };
};
