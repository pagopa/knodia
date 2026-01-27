import { match } from "ts-pattern";

import type { EserviceWriterService } from "./eserviceWriterService.ts";

export async function handleEserviceEvent(
  message: EserviceEventEnvelope,
  writerService: EserviceWriterService,
): Promise<void> {
  return match(message.type)
    .with("EserviceAdded", async () => {
      await writerService.insertEservice();
    })
    .otherwise(() => {
      console.warn("Unhandled event type: ", message.type);
    });
}
