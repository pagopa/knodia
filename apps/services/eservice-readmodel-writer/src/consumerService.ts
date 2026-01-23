import {
  type EserviceEvent,
  EserviceEventSchema,
} from "@knodia/eservice-models/events";
import { match, P } from "ts-pattern";

import type { EserviceWriterService } from "./eserviceWriterService.ts";

export async function handleEserviceEvent(
  event: EserviceEvent,
  writerService: EserviceWriterService,
): Promise<void> {
  return match(event)
    .with(
      { type: P.union("EServiceCreatedV1", "EserviceVersionCreatedV1") },
      async (e) => {
        await writerService.insertEservice(e.data.eservice);
      },
    )
    .exhaustive();
}

export function parseEserviceEvent(payload: string): EserviceEvent {
  return EserviceEventSchema.parse(JSON.parse(payload));
}
