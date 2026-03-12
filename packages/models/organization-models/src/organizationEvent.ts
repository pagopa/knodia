import { EventEnvelope } from "@knodia/common-models/event";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { z } from "zod";

import { OrganizationCreatedV1 } from "./generated/v1/organizationEvents.ts";

export const OrganizationEventV1 = z.discriminatedUnion("type", [
  z.object({
    data: protobufBinaryCodec(OrganizationCreatedV1),
    type: z.literal("OrganizationCreatedV1"),
  }),
]);
export type OrganizationEventV1 = z.infer<typeof OrganizationEventV1>;

const OrganizationEventEnvelopeV1 = EventEnvelope(OrganizationEventV1);
export type OrganizationEventEnvelopeV1 = z.infer<
  typeof OrganizationEventEnvelopeV1
>;
