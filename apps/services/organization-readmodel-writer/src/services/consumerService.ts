import type { OrganizationWriterService } from "@knodia/db-readmodel-organization/writer";

import { assertDataExistsInEvent } from "@knodia/kafka-commons/utils";
import {
  fromOrganizationV1,
  type OrganizationEventEnvelopeV1,
} from "@knodia/organization-models";
import { match } from "ts-pattern";

export async function handleOrganizationEvent(
  message: OrganizationEventEnvelopeV1,
  writerService: OrganizationWriterService,
): Promise<void> {
  assertDataExistsInEvent(message, "organization");

  return match(message)
    .with({ type: "OrganizationCreatedV1" }, async (msg) => {
      await writerService.upsertOrganization(
        fromOrganizationV1(msg.data.organization),
        message.version,
      );
    })
    .exhaustive();
}
