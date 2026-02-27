import { EventEnvelope } from "@knodia/common-models/event";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { z } from "zod";

import { ConsumerKeychainCreatedV1 } from "./generated/v1/consumerKeychainEvents.ts";

export const ConsumerKeychainEventV1 = z.discriminatedUnion("type", [
  z.object({
    data: protobufBinaryCodec(ConsumerKeychainCreatedV1),
    type: z.literal("ConsumerKeychainCreatedV1"),
  }),
]);
export type ConsumerKeychainEventV1 = z.infer<typeof ConsumerKeychainEventV1>;

export const ConsumerKeychainEventEnvelopeV1 = EventEnvelope(
  ConsumerKeychainEventV1,
);
export type ConsumerKeychainEventEnvelopeV1 = z.infer<
  typeof ConsumerKeychainEventEnvelopeV1
>;
