import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.js";
import type { KafkaConsumerLoggerMetadata } from "@knodia/logger/models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Logger } from "pino";

import { unsafeBrandId } from "@knodia/common-models/ids";
import { eserviceWriterServiceBuilder } from "@knodia/db-readmodel-eservice/writer";
import { EserviceEventV1 } from "@knodia/eservice-models";
import { decodeKafkaMessageEvent } from "@knodia/kafka-commons/utils";

import { handleEserviceEvent } from "../services/consumerService.ts";

export const createProcessMessage = (
  readmodelDb: NodePgDatabase,
  logger: Logger,
) => {
  const eserviceWriterService = eserviceWriterServiceBuilder(readmodelDb);

  return async function processMessage({
    message,
    partition,
  }: EachMessagePayload) {
    const event = decodeKafkaMessageEvent(message, EserviceEventV1);

    const loggerMetadata: KafkaConsumerLoggerMetadata = {
      correlationId: unsafeBrandId(event.correlation_id),
      eventType: event.type,
      eventVersion: event.version,
      streamId: event.stream_id,
      streamVersion: event.version,
    };
    const messageLogger = logger.child(loggerMetadata);

    messageLogger.info({ event }, "Processing event");

    await handleEserviceEvent(event, eserviceWriterService);

    messageLogger.info(
      `Read model was updated. Partition number: ${partition}. Offset: ${message.offset}`,
    );
  };
};
