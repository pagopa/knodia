import { EventEnvelope } from "@knodia/common-models/event";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { z } from "zod";

import { PurposeActivatedV1 } from "./generated/v1/purposeEvents.ts";

export const PurposeEventV1 = z.discriminatedUnion("type", [
  z.object({
    data: protobufBinaryCodec(PurposeActivatedV1),
    type: z.literal("PurposeActivatedV1"),
  }),
]);
export type PurposeEventV1 = z.infer<typeof PurposeEventV1>;

const PurposeEventEnvelopeV1 = EventEnvelope(PurposeEventV1);
/** @knipignore - will be used when implementing rmw */
export type PurposeEventEnvelopeV1 = z.infer<typeof PurposeEventEnvelopeV1>;
