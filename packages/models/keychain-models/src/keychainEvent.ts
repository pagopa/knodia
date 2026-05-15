import { EventEnvelope } from "@knodia/common-models/event";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { z } from "zod";

import {
  ConsumerKeychainCreatedV1,
  ConsumerKeychainDeletedV1,
  ConsumerKeychainKeyAddedV1,
  ConsumerKeychainKeyRemovedV1,
  ConsumerKeychainMemberAddedV1,
  ConsumerKeychainMemberRemovedV1,
  ConsumerKeychainPurposeLinkedV1,
  ConsumerKeychainPurposeUnlinkedV1,
  ConsumerKeychainUpdatedV1,
  KnodeApiKeychainCreatedV1,
  KnodeApiKeychainKeyAddedV1,
  KnodeApiKeychainKeyRemovedV1,
  KnodeApiKeychainMemberAddedV1,
  KnodeApiKeychainMemberRemovedV1,
  KnodeApiKeychainUpdatedV1,
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
    data: protobufBinaryCodec(ConsumerKeychainPurposeUnlinkedV1),
    type: z.literal("ConsumerKeychainPurposeUnlinkedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(ConsumerKeychainMemberAddedV1),
    type: z.literal("ConsumerKeychainMemberAddedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(ConsumerKeychainMemberRemovedV1),
    type: z.literal("ConsumerKeychainMemberRemovedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(ConsumerKeychainKeyAddedV1),
    type: z.literal("ConsumerKeychainKeyAddedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(ConsumerKeychainKeyRemovedV1),
    type: z.literal("ConsumerKeychainKeyRemovedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(KnodeApiKeychainCreatedV1),
    type: z.literal("KnodeApiKeychainCreatedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(KnodeApiKeychainUpdatedV1),
    type: z.literal("KnodeApiKeychainUpdatedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(KnodeApiKeychainKeyAddedV1),
    type: z.literal("KnodeApiKeychainKeyAddedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(KnodeApiKeychainMemberAddedV1),
    type: z.literal("KnodeApiKeychainMemberAddedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(KnodeApiKeychainMemberRemovedV1),
    type: z.literal("KnodeApiKeychainMemberRemovedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(KnodeApiKeychainKeyRemovedV1),
    type: z.literal("KnodeApiKeychainKeyRemovedV1"),
  }),
]);
export type KeychainEventV1 = z.infer<typeof KeychainEventV1>;

export const KeychainEventEnvelopeV1 = EventEnvelope(KeychainEventV1);
export type KeychainEventEnvelopeV1 = z.infer<typeof KeychainEventEnvelopeV1>;
