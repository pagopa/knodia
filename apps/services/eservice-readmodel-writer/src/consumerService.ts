import type { EserviceEventEnvelopeV1 } from "@knodia/eservice-models";

import { match } from "ts-pattern";

import type { EserviceWriterService } from "./eserviceWriterService.ts";

export async function handleEserviceEvent(
  message: EserviceEventEnvelopeV1,
  writerService: EserviceWriterService,
): Promise<void> {
  return match(message)
    .with({ type: "EserviceVersionActivatedV1" }, async () => {
      await writerService.insertEservice();
      // ^ TODO populate with real data from event
    })
    .otherwise(() => {
      console.warn("Unhandled event type: ", message.type);
    });
}
