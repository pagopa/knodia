import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { KafkaConsumerLoggerMetadata } from "@knodia/logger/models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Logger } from "pino";

import { unsafeBrandId } from "@knodia/common-models/ids";
import { organizationWriterServiceBuilder } from "@knodia/db-readmodel-organization/writer";
import { decodeKafkaMessageEvent } from "@knodia/kafka-commons/utils";
import { OrganizationEventV1 } from "@knodia/organization-models";

import { handleOrganizationEvent } from "../services/consumerService.ts";

export const createProcessMessage = (
  readmodelDb: NodePgDatabase,
  logger: Logger,
) => {
  const organizationWriterService =
    organizationWriterServiceBuilder(readmodelDb);

  return async function processMessage({
    message,
    partition,
  }: EachMessagePayload) {
    const event = decodeKafkaMessageEvent(message, OrganizationEventV1);

    const loggerMetadata: KafkaConsumerLoggerMetadata = {
      correlationId: unsafeBrandId(event.correlation_id),
      eventType: event.type,
      eventVersion: event.version,
      streamId: event.stream_id,
      streamVersion: event.version,
    };

    const messageLogger = logger.child(loggerMetadata);

    await handleOrganizationEvent(
      event,
      organizationWriterService,
      messageLogger,
    );

    messageLogger.info(
      `Read model was updated. Partition number: ${partition}. Offset: ${message.offset}`,
    );
  };
};
