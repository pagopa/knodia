import type { SignupUser, SignupUserId } from "@knodia/signup-models";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import { eq } from "drizzle-orm";

import { toSignupUser, toSignupUserSQL } from "../converters/converters.ts";
import { signupUser } from "../signupUser.ts";

/** @knipignore */
export type SignupService = ReturnType<typeof signupServiceBuilder>;

/** @knipignore */
export function signupServiceBuilder(db: NodePgDatabase) {
  return {
    async getSignupUserById(
      signupUserId: SignupUserId,
    ): Promise<SignupUser | undefined> {
      const [result] = await db
        .select()
        .from(signupUser)
        .where(eq(signupUser.signupUserId, signupUserId))
        .limit(1);
      return result ? toSignupUser(result) : undefined;
    },
    async insertSignupUser(user: SignupUser): Promise<void> {
      await db.insert(signupUser).values(toSignupUserSQL(user));
    },
  };
}
