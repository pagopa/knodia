import { EventEnvelope } from "@knodia/common-models/event";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { z } from "zod";

import {
  EserviceUpdatedV1,
  EserviceVersionActivatedV1,
  EserviceVersionReactivatedV1,
  EserviceVersionSuspendedV1,
} from "./generated/v1/eserviceEvents.ts";

export const EserviceEventV1 = z.discriminatedUnion("type", [
  z.object({
    data: protobufBinaryCodec(EserviceUpdatedV1),
    type: z.literal("EserviceUpdatedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(EserviceVersionActivatedV1),
    type: z.literal("EserviceVersionActivatedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(EserviceVersionReactivatedV1),
    type: z.literal("EserviceVersionReactivatedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(EserviceVersionSuspendedV1),
    type: z.literal("EserviceVersionSuspendedV1"),
  }),
]);
export type EserviceEventV1 = z.infer<typeof EserviceEventV1>;

export const EserviceEventEnvelopeV1 = EventEnvelope(EserviceEventV1);
export type EserviceEventEnvelopeV1 = z.infer<typeof EserviceEventEnvelopeV1>;
