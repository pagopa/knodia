import { z } from "zod";

export const SignupUserId = z.uuid().brand<"SignupUserId">();
export type SignupUserId = z.infer<typeof SignupUserId>;

export function generateSignupUserId(): SignupUserId {
  return crypto.randomUUID() as SignupUserId;
}

/** @knipignore */
export const SignupUserStatus = z.enum(["ACTIVE", "SUSPENDED"]);
export type SignupUserStatus = z.infer<typeof SignupUserStatus>;

// Per-Knode generated names that signup-updater uses to create org+user on each Knode.
const SignupGeneratedNamesPerKnode = z.strictObject({
  organizationName: z.string(),
  userName: z.string(),
});

/** @knipignore */
export const SignupGeneratedNames = z.strictObject({
  Lynx: SignupGeneratedNamesPerKnode,
  Orion: SignupGeneratedNamesPerKnode,
});
export type SignupGeneratedNames = z.infer<typeof SignupGeneratedNames>;

export const SignupUser = z
  .strictObject({
    createdAt: z.coerce.date(),
    dateOfBirth: z.iso.date(),
    // Not a One Identity claim — user types it on the FE form.
    email: z.email(),
    familyName: z.string(),
    fiscalNumber: z.string().optional(),
    generatedNames: SignupGeneratedNames,
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
