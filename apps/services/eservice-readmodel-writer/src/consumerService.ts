import { match } from "ts-pattern";
import { z } from "zod";

import type { EserviceWriterService } from "./eserviceWriterService.ts";

// TODO: define event in eservice-models
const EserviceAddedEvent = z.object({
  data: z.strictObject({
    id: z.string(),
  }),
  type: z.literal("EserviceAdded"),
});

const EserviceEvent = z.discriminatedUnion("type", [EserviceAddedEvent]);
type EserviceEvent = z.infer<typeof EserviceEvent>;

export async function handleEserviceEvent(
  event: EserviceEvent,
  writerService: EserviceWriterService,
): Promise<void> {
  return match(event.type)
    .with("EserviceAdded", async () => {
      await writerService.upsertEservice(event.data);
    })
    .exhaustive();
}

export function parseEserviceEvent(payload: string): EserviceEvent {
  return EserviceEvent.parse(JSON.parse(payload));
}
