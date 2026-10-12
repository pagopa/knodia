import { SignupUserId } from "@knodia/common-models/ids";
import { exactlyOneDefined } from "@knodia/common-models/utils";
import { z } from "zod";

export const SignupUserStatus = z.enum([
  "OnboardingPending",
  "Active",
  "Suspended",
  "DeletionPending",
]);
export type SignupUserStatus = z.infer<typeof SignupUserStatus>;

export const SuspensionReason = z.enum([
  "AccuracyContested",
  "UnlawfulProcessing",
  "DataNeededForLegalClaims",
  "PendingObjectionVerification",
]);
export type SuspensionReason = z.infer<typeof SuspensionReason>;

const SignupGeneratedEntitiesPerKnode = z.strictObject({
  organizationName: z.string(),
  userName: z.string(),
});

export const SignupGeneratedEntities = z.strictObject({
  Lynx: SignupGeneratedEntitiesPerKnode,
  Orion: SignupGeneratedEntitiesPerKnode,
});
export type SignupGeneratedEntities = z.infer<typeof SignupGeneratedEntities>;

const SignupUserBase = z.strictObject({
  createdAt: z.coerce.date(),
  dateOfBirth: z.iso.date(),
  // Not a One Identity claim — user types it on the FE form.
  email: z.email(),
  familyName: z.string(),
  // .min(1): an empty-string identifier is "present" to the exactly-one refine
  // but absent to the truthiness-based DB lookup, so reject it at the boundary.
  fiscalNumber: z.string().min(1).optional(),
  generatedEntities: SignupGeneratedEntities,
  name: z.string(),
  signupUserId: SignupUserId,
  spidCode: z.string().min(1).optional(),
  // Legal acceptance instant; separate from createdAt because it diverges once
  // re-acceptance of future T&C versions exists.
  termsAcceptedAt: z.coerce.date(),
  // Document version the user accepted: which frozen T&C text they agreed to, recorded
  // per acceptance and independent of the current version.
  termsAcceptedVersion: z.number().int().positive(),
  updatedAt: z.coerce.date(),
});

const NonSuspendedSignupUser = SignupUserBase.extend({
  status: SignupUserStatus.extract([
    SignupUserStatus.enum.OnboardingPending,
    SignupUserStatus.enum.Active,
    SignupUserStatus.enum.DeletionPending,
  ]),
});

const SuspendedSignupUser = SignupUserBase.extend({
  status: SignupUserStatus.extract([SignupUserStatus.enum.Suspended]),
  suspendedAt: z.coerce.date(),
  suspensionReason: SuspensionReason,
});

export const SignupUser = z
  .discriminatedUnion("status", [NonSuspendedSignupUser, SuspendedSignupUser])
  .refine((u) => exactlyOneDefined(u.spidCode, u.fiscalNumber), {
    message: "exactly one of spidCode / fiscalNumber must be set",
    path: ["spidCode"],
  });
export type SignupUser = z.infer<typeof SignupUser>;
