import { EventEnvelope } from "@knodia/common-models/event";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { z } from "zod";

import {
  AgreementActivatedByConsumerOperatorV1,
  AgreementActivatedV1,
  AgreementArchivedV1,
  AgreementCreatedPendingConsumerOperatorIdentificationV1,
  AgreementReactivatedByConsumerV1,
  AgreementReactivatedByProducerV1,
  AgreementSuspendedByConsumerV1,
  AgreementSuspendedByProducerV1,
} from "./generated/v1/agreementEvents.ts";

export const AgreementEventV1 = z.discriminatedUnion("type", [
  z.object({
    data: protobufBinaryCodec(AgreementActivatedV1),
    type: z.literal("AgreementActivatedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(
      AgreementCreatedPendingConsumerOperatorIdentificationV1,
    ),
    type: z.literal("AgreementCreatedPendingConsumerOperatorIdentificationV1"),
  }),
  z.object({
    data: protobufBinaryCodec(AgreementActivatedByConsumerOperatorV1),
    type: z.literal("AgreementActivatedByConsumerOperatorV1"),
  }),
  z.object({
    data: protobufBinaryCodec(AgreementSuspendedByConsumerV1),
    type: z.literal("AgreementSuspendedByConsumerV1"),
  }),
  z.object({
    data: protobufBinaryCodec(AgreementSuspendedByProducerV1),
    type: z.literal("AgreementSuspendedByProducerV1"),
  }),
  z.object({
    data: protobufBinaryCodec(AgreementReactivatedByConsumerV1),
    type: z.literal("AgreementReactivatedByConsumerV1"),
  }),
  z.object({
    data: protobufBinaryCodec(AgreementReactivatedByProducerV1),
    type: z.literal("AgreementReactivatedByProducerV1"),
  }),
  z.object({
    data: protobufBinaryCodec(AgreementArchivedV1),
    type: z.literal("AgreementArchivedV1"),
  }),
]);
export type AgreementEventV1 = z.infer<typeof AgreementEventV1>;

const AgreementEventEnvelopeV1 = EventEnvelope(AgreementEventV1);
export type AgreementEventEnvelopeV1 = z.infer<typeof AgreementEventEnvelopeV1>;
