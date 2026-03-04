import { EventEnvelope } from "@knodia/common-models/event";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { z } from "zod";

import { ConsumerKeychainCreatedV1 } from "./generated/v1/keychainEvents.ts";

export const KeychainEventV1 = z.discriminatedUnion("type", [
  z.object({
    data: protobufBinaryCodec(ConsumerKeychainCreatedV1),
    type: z.literal("ConsumerKeychainCreatedV1"),
  }),
]);
export type KeychainEventV1 = z.infer<typeof KeychainEventV1>;

export const KeychainEventEnvelopeV1 = EventEnvelope(KeychainEventV1);
export type KeychainEventEnvelopeV1 = z.infer<typeof KeychainEventEnvelopeV1>;
