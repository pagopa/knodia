import type { EserviceWriterService } from "@knodia/db-readmodel-eservice/writer";

import {
  type EserviceEventEnvelopeV1,
  fromEserviceV1,
} from "@knodia/eservice-models";
import { assertDataExistsInEvent } from "@knodia/kafka-commons/utils";
import { match } from "ts-pattern";

export async function handleEserviceEvent(
  message: EserviceEventEnvelopeV1,
  writerService: EserviceWriterService,
): Promise<void> {
  assertDataExistsInEvent(message, "eservice");

  return match(message)
    .with(
      { type: "EserviceUpdatedV1" },
      { type: "EserviceVersionActivatedV1" },
      { type: "EserviceVersionArchivedV1" },
      { type: "EserviceVersionReactivatedV1" },
      { type: "EserviceVersionSuspendedV1" },
      async (msg) => {
        await writerService.upsertEservice(
          fromEserviceV1(msg.data.eservice),
          message.version,
        );
      },
    )
    .exhaustive();
}
