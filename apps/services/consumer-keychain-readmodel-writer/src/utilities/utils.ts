import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { LoggerConfig } from "@knodia/logger/config";
import type { KafkaConsumerLoggerMetadata } from "@knodia/logger/models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { unsafeBrandId } from "@knodia/common-models/ids";
import { ConsumerKeychainEventV1 } from "@knodia/consumer-keychain-models";
import { consumerKeychainWriterServiceBuilder } from "@knodia/db-readmodel-consumer-keychain/writer";
import { decodeKafkaMessageEvent } from "@knodia/kafka-commons/utils";
import { createLogger } from "@knodia/logger";

import { handleConsumerKeychainEvent } from "../services/consumerService.ts";

export const createProcessMessage = (
  readmodelDb: NodePgDatabase,
  loggerConfig: LoggerConfig,
) => {
  const consumerKeychainWriterService =
    consumerKeychainWriterServiceBuilder(readmodelDb);

  return async function processMessage({
    message,
    partition,
  }: EachMessagePayload) {
    const event = decodeKafkaMessageEvent(message, ConsumerKeychainEventV1);

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
      serviceName: "consumer-keychain-readmodel-writer",
    });

    await handleConsumerKeychainEvent(event, consumerKeychainWriterService);

    logger.info(
      `Read model was updated. Partition number: ${partition}. Offset: ${message.offset}`,
    );
  };
};
