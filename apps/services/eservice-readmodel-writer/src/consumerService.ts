import { EventEnvelope } from "@knodia/kafka-commons/utils";
import { match } from "ts-pattern";
import { z } from "zod";

import type { EserviceWriterService } from "./eserviceWriterService.ts";

// TODO: define events and models in shared model package
const EserviceAddedEvent = z.object({
  data: z.strictObject({
    // TODO: decode protobuf data
    id: z.string(),
  }),
  type: z.literal("EserviceAdded"),
});

const EserviceEvent = z.discriminatedUnion("type", [EserviceAddedEvent]);
export type EserviceEvent = z.infer<typeof EserviceEvent>;

// TODO: define events and models in shared model package
export const EserviceEventEnvelope = EventEnvelope(EserviceEvent);
export type EserviceEventEnvelope = z.infer<typeof EserviceEventEnvelope>;

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
