import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { KafkaConsumerLoggerMetadata } from "@knodia/logger/models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Logger } from "pino";

import { unsafeBrandId } from "@knodia/common-models/ids";
import { purposeWriterServiceBuilder } from "@knodia/db-readmodel-purpose/writer";
import { decodeKafkaMessageEvent } from "@knodia/kafka-commons/utils";
import { PurposeEventV1 } from "@knodia/purpose-models";

import { handlePurposeEvent } from "../services/consumerService.ts";

export const createProcessMessage = (
  readmodelDb: NodePgDatabase,
  logger: Logger,
) => {
  const purposeWriterService = purposeWriterServiceBuilder(readmodelDb);

  return async function processMessage({
    message,
    partition,
  }: EachMessagePayload) {
    const event = decodeKafkaMessageEvent(message, PurposeEventV1);

    const loggerMetadata: KafkaConsumerLoggerMetadata = {
      correlationId: unsafeBrandId(event.correlation_id),
      eventType: event.type,
      eventVersion: event.version,
      streamId: event.stream_id,
      streamVersion: event.version,
    };

    const messageLogger = logger.child(loggerMetadata);

    await handlePurposeEvent(event, purposeWriterService);

    messageLogger.info(
      `Read model was updated. Partition number: ${partition}. Offset: ${message.offset}`,
    );
  };
};
