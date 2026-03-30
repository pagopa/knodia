import { EventEnvelope } from "@knodia/common-models/event";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { z } from "zod";

import {
  ConsumerKeychainCreatedV1,
  ConsumerKeychainDeletedV1,
  ConsumerKeychainMemberAddedV1,
  ConsumerKeychainPurposeLinkedV1,
  ConsumerKeychainUpdatedV1,
} from "./generated/v1/keychainEvents.ts";

export const KeychainEventV1 = z.discriminatedUnion("type", [
  z.object({
    data: protobufBinaryCodec(ConsumerKeychainCreatedV1),
    type: z.literal("ConsumerKeychainCreatedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(ConsumerKeychainDeletedV1),
    type: z.literal("ConsumerKeychainDeletedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(ConsumerKeychainUpdatedV1),
    type: z.literal("ConsumerKeychainUpdatedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(ConsumerKeychainPurposeLinkedV1),
    type: z.literal("ConsumerKeychainPurposeLinkedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(ConsumerKeychainMemberAddedV1),
    type: z.literal("ConsumerKeychainMemberAddedV1"),
  }),
]);
export type KeychainEventV1 = z.infer<typeof KeychainEventV1>;

export const KeychainEventEnvelopeV1 = EventEnvelope(KeychainEventV1);
export type KeychainEventEnvelopeV1 = z.infer<typeof KeychainEventEnvelopeV1>;
