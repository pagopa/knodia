import { EventEnvelope } from "@knodia/common-models/event";
import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { z } from "zod";

import { AgreementActivatedV1 } from "./generated/v1/agreementEvents.ts";

export const AgreementEventV1 = z.discriminatedUnion("type", [
  z.object({
    data: protobufBinaryCodec(AgreementActivatedV1),
    type: z.literal("AgreementActivatedV1"),
  }),
]);
export type AgreementEventV1 = z.infer<typeof AgreementEventV1>;

export const AgreementEventEnvelopeV1 = EventEnvelope(AgreementEventV1);
export type AgreementEventEnvelopeV1 = z.infer<typeof AgreementEventEnvelopeV1>;
