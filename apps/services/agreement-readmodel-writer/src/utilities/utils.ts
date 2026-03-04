import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { KafkaConsumerLoggerMetadata } from "@knodia/logger/models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Logger } from "pino";

import { AgreementEventV1 } from "@knodia/agreement-models";
import { unsafeBrandId } from "@knodia/common-models/ids";
import { agreementWriterServiceBuilder } from "@knodia/db-readmodel-agreement/writer";
import { decodeKafkaMessageEvent } from "@knodia/kafka-commons/utils";

import { handleAgreementEvent } from "../services/consumerService.ts";

export const createProcessMessage = (
  readmodelDb: NodePgDatabase,
  logger: Logger,
) => {
  const agreementWriterService = agreementWriterServiceBuilder(readmodelDb);

  return async function processMessage({
    message,
    partition,
  }: EachMessagePayload) {
    const event = decodeKafkaMessageEvent(message, AgreementEventV1);

    const loggerMetadata: KafkaConsumerLoggerMetadata = {
      correlationId: unsafeBrandId(event.correlation_id),
      eventType: event.type,
      eventVersion: event.version,
      streamId: event.stream_id,
      streamVersion: event.version,
    };

    const messageLogger = logger.child(loggerMetadata);

    await handleAgreementEvent(event, agreementWriterService);

    messageLogger.info(
      `Read model was updated. Partition number: ${partition}. Offset: ${message.offset}`,
    );
  };
};
