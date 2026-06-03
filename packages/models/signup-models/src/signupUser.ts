import { SignupUserId } from "@knodia/common-models/ids";
import { z } from "zod";

export const SignupUserStatus = z.enum(["Active", "Suspended"]);
export type SignupUserStatus = z.infer<typeof SignupUserStatus>;

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

export const SignupUser = z
  .strictObject({
    createdAt: z.coerce.date(),
    dateOfBirth: z.iso.date(),
    // Not a One Identity claim — user types it on the FE form.
    email: z.email(),
    familyName: z.string(),
    fiscalNumber: z.string().optional(),
    generatedEntities: SignupGeneratedEntities,
    name: z.string(),
    personIdentifier: z.string().optional(),
    signupUserId: SignupUserId,
    spidCode: z.string().optional(),
    status: SignupUserStatus,
    updatedAt: z.coerce.date(),
  })
  .refine(
    (u) =>
      u.spidCode !== undefined ||
      u.fiscalNumber !== undefined ||
      u.personIdentifier !== undefined,
    {
      message:
        "at least one of spidCode / fiscalNumber / personIdentifier must be set",
      path: ["spidCode"],
    },
  );
export type SignupUser = z.infer<typeof SignupUser>;
