import type { OrganizationWriterService } from "@knodia/db-readmodel-organization/writer";
import type { Logger } from "pino";

import { assertDataExistsInEvent } from "@knodia/kafka-commons/utils";
import {
  fromOrganizationV1,
  type OrganizationEventEnvelopeV1,
} from "@knodia/organization-models";
import { match } from "ts-pattern";

export async function handleOrganizationEvent(
  message: OrganizationEventEnvelopeV1,
  writerService: OrganizationWriterService,
  logger: Logger,
): Promise<void> {
  assertDataExistsInEvent(message, "organization");

  return match(message)
    .with({ type: "OrganizationCreatedV1" }, async (msg) => {
      await writerService.upsertOrganization(
        fromOrganizationV1(msg.data.organization),
        message.version,
        logger,
      );
    })
    .exhaustive();
}
