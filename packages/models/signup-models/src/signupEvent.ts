import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { z } from "zod";

import { OnboardingCompletedV1 as OnboardingCompletedProtoV1 } from "./generated/v1/signupEvents.ts";
import { SignupUserId } from "./signupUser.ts";

// `.pipe` rejects protobuf payloads that decode to an empty signupUserId
// (proto3 accepts string defaults; SignupUserId requires a UUID).
const OnboardingCompletedPayloadV1 = protobufBinaryCodec(
  OnboardingCompletedProtoV1,
).pipe(z.strictObject({ signupUserId: SignupUserId }));

/**
 * Wire format on Kafka:
 *   message.key              = Buffer.from(signupUserId, "utf8")
 *   message.value            = Buffer of protobuf-encoded payload bytes
 *   message.headers.type     = e.g. "OnboardingCompletedV1"
 *
 * Consumer rebuilds the event with
 *   SignupEventV1.parse({ type: headers.type.toString(), data: value })
 *
 * Keying by signupUserId ensures all events for the same user share a
 * partition and are processed in order.
 */
export const SignupEventV1 = z.discriminatedUnion("type", [
  z.object({
    data: OnboardingCompletedPayloadV1,
    type: z.literal("OnboardingCompletedV1"),
  }),
]);
export type SignupEventV1 = z.infer<typeof SignupEventV1>;
