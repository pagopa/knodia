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
  KnodiaApiKeychainCreatedV1,
  KnodiaApiKeychainDeletedV1,
  KnodiaApiKeychainKeyAddedV1,
  KnodiaApiKeychainKeyRemovedV1,
  KnodiaApiKeychainMemberAddedV1,
  KnodiaApiKeychainMemberRemovedV1,
  KnodiaApiKeychainUpdatedV1,
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
    data: protobufBinaryCodec(KnodiaApiKeychainCreatedV1),
    type: z.literal("KnodiaApiKeychainCreatedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(KnodiaApiKeychainDeletedV1),
    type: z.literal("KnodiaApiKeychainDeletedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(KnodiaApiKeychainUpdatedV1),
    type: z.literal("KnodiaApiKeychainUpdatedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(KnodiaApiKeychainMemberAddedV1),
    type: z.literal("KnodiaApiKeychainMemberAddedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(KnodiaApiKeychainMemberRemovedV1),
    type: z.literal("KnodiaApiKeychainMemberRemovedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(KnodiaApiKeychainKeyAddedV1),
    type: z.literal("KnodiaApiKeychainKeyAddedV1"),
  }),
  z.object({
    data: protobufBinaryCodec(KnodiaApiKeychainKeyRemovedV1),
    type: z.literal("KnodiaApiKeychainKeyRemovedV1"),
  }),
]);
export type KeychainEventV1 = z.infer<typeof KeychainEventV1>;

export const KeychainEventEnvelopeV1 = EventEnvelope(KeychainEventV1);
export type KeychainEventEnvelopeV1 = z.infer<typeof KeychainEventEnvelopeV1>;
