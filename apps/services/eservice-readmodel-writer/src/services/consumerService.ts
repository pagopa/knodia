import type { EserviceEventEnvelopeV1 } from "@knodia/eservice-models";

import { fromEserviceV1 } from "@knodia/eservice-models";
import { assertDataExistsInEvent } from "@knodia/kafka-commons/utils";
import { match } from "ts-pattern";

import type { EserviceWriterService } from "./eserviceWriterService.ts";

export async function handleEserviceEvent(
  message: EserviceEventEnvelopeV1,
  writerService: EserviceWriterService,
): Promise<void> {
  console.log(`Handling event: ${message}`);
  assertDataExistsInEvent(message, "eservice");

  return match(message)
    .with({ type: "EserviceVersionActivatedV1" }, async (msg) => {
      await writerService.upsertEservice(
        fromEserviceV1(msg.data.eservice),
        message.version,
      );
    })
    .exhaustive();
}
