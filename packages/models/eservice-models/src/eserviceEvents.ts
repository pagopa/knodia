import { z } from "zod";

import { EserviceV1 } from "./generated/v1/eservice.ts";

export const EServiceCreatedEvent = z.object({
  data: z.strictObject({
    eservice: EserviceV1,
  }),
  type: z.literal("EServiceCreatedV1"),
});

export const EserviceVersionCreatedEvent = z.object({
  data: z.strictObject({
    eservice: EserviceV1,
    eserviceVersionId: z.string(),
  }),
  type: z.literal("EserviceVersionCreatedV1"),
});

export const EserviceEventSchema = z.discriminatedUnion("type", [
  EServiceCreatedEvent,
  EserviceVersionCreatedEvent,
]);

export type EserviceEvent = z.infer<typeof EserviceEventSchema>;
