import { SignupUserId } from "@knodia/common-models/ids";
import { exactlyOneDefined } from "@knodia/common-models/utils";
import { z } from "zod";

export const SignupUserStatus = z.enum([
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

/** @knipignore */
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
  personIdentifier: z.string().min(1).optional(),
  signupUserId: SignupUserId,
  spidCode: z.string().min(1).optional(),
  updatedAt: z.coerce.date(),
});

const ActiveSignupUser = SignupUserBase.extend({
  status: SignupUserStatus.extract([
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
  .discriminatedUnion("status", [ActiveSignupUser, SuspendedSignupUser])
  .refine(
    (u) => exactlyOneDefined(u.spidCode, u.fiscalNumber, u.personIdentifier),
    {
      message:
        "exactly one of spidCode / fiscalNumber / personIdentifier must be set",
      path: ["spidCode"],
    },
  );
export type SignupUser = z.infer<typeof SignupUser>;
