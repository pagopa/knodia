import { protobufBinaryCodec } from "@knodia/common-models/protobuf";
import { z } from "zod";

import { OnboardingCompletedV1 as OnboardingCompletedProtoV1 } from "./generated/v1/signupEvents.ts";
import { SignupUserId } from "./signupUser.ts";

// `.pipe` rejects protobuf payloads that decode to an empty signupUserId
// (proto3 accepts string defaults; SignupUserId requires a UUID).
const OnboardingCompletedPayloadV1 = protobufBinaryCodec(
  OnboardingCompletedProtoV1,
).pipe(z.strictObject({ signupUserId: SignupUserId }));

export const SignupEventV1 = z.discriminatedUnion("type", [
  z.object({
    data: OnboardingCompletedPayloadV1,
    type: z.literal("OnboardingCompletedV1"),
  }),
]);
export type SignupEventV1 = z.infer<typeof SignupEventV1>;
