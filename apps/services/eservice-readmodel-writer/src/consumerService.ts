import { Eservice as EserviceSchema } from "@knodia/eservice-models";
import { z } from "zod";

import type { EserviceWriterService } from "./eserviceWriterService.ts";

const EserviceUpsertedEvent = z.object({
  data: EserviceSchema,
  type: z.literal("EserviceUpserted"),
});

const EserviceDeletedEvent = z.object({
  data: z.object({
    id: z.string(),
  }),
  type: z.literal("EserviceDeleted"),
});

const EserviceEvent = z.discriminatedUnion("type", [
  EserviceUpsertedEvent,
  EserviceDeletedEvent,
]);

type EserviceEvent = z.infer<typeof EserviceEvent>;

export async function handleEserviceEvent(
  event: EserviceEvent,
  writerService: EserviceWriterService,
): Promise<void> {
  if (event.type === "EserviceUpserted") {
    await writerService.upsertEservice(event.data);
    return;
  }

  await writerService.deleteEservice(event.data.id);
}

export function parseEserviceEvent(payload: string): EserviceEvent {
  return EserviceEvent.parse(JSON.parse(payload));
}
