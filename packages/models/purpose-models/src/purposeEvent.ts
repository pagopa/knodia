import { EventEnvelope } from "@knodia/common-models/event";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { z } from "zod";

import {
  PurposeActivatedV1,
  PurposeReactivatedByConsumerV1,
  PurposeReactivatedByProducerV1,
  PurposeSuspendedByConsumerV1,
  PurposeSuspendedByProducerV1,
} from "./generated/v1/purposeEvents.ts";

export const PurposeEventV1 = z.discriminatedUnion("type", [
  z.object({
    data: protobufBinaryCodec(PurposeActivatedV1),
    type: z.literal("PurposeActivatedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(PurposeSuspendedByConsumerV1),
    type: z.literal("PurposeSuspendedByConsumerV1"),
  }),
  z.object({
    data: protobufBinaryCodec(PurposeSuspendedByProducerV1),
    type: z.literal("PurposeSuspendedByProducerV1"),
  }),
  z.object({
    data: protobufBinaryCodec(PurposeReactivatedByConsumerV1),
    type: z.literal("PurposeReactivatedByConsumerV1"),
  }),
  z.object({
    data: protobufBinaryCodec(PurposeReactivatedByProducerV1),
    type: z.literal("PurposeReactivatedByProducerV1"),
  }),
]);
export type PurposeEventV1 = z.infer<typeof PurposeEventV1>;

const PurposeEventEnvelopeV1 = EventEnvelope(PurposeEventV1);
export type PurposeEventEnvelopeV1 = z.infer<typeof PurposeEventEnvelopeV1>;
