import { generateId, type SignupUserId } from "@knodia/common-models/ids";
import { signupUser } from "@knodia/db-signup";
import { signupDbServiceBuilder } from "@knodia/db-signup/services";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { signupDb } from "./setup.ts";
import { makeSignupUser, seedSignupUser } from "./utils.ts";

async function getRow(signupUserId: SignupUserId) {
  const [row] = await signupDb
    .select()
    .from(signupUser)
    .where(eq(signupUser.signupUserId, signupUserId));
  return row;
}

// signupDb is assigned in the setup beforeAll, so the service must be built lazily
function signupDbService() {
  return signupDbServiceBuilder(signupDb);
}

describe("markSignupUserDeletionPending", () => {
  it("flips an Active user to DeletionPending and bumps updatedAt", async () => {
    const user = makeSignupUser();
    await seedSignupUser(user);

    await signupDbService().markSignupUserDeletionPending(user.signupUserId);

    const row = await getRow(user.signupUserId);
    expect(row?.status).toBe("DeletionPending");
    expect(row?.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime());
  });

  it("is idempotent: a second call does not bump the row", async () => {
    const user = makeSignupUser();
    await seedSignupUser(user);

    await signupDbService().markSignupUserDeletionPending(user.signupUserId);
    const afterFirst = await getRow(user.signupUserId);

    await signupDbService().markSignupUserDeletionPending(user.signupUserId);
    const afterSecond = await getRow(user.signupUserId);

    expect(afterSecond?.status).toBe("DeletionPending");
    expect(afterSecond?.updatedAt).toEqual(afterFirst?.updatedAt);
  });

  it("is idempotent: marking an already-completed deletion is a no-op", async () => {
    const user = makeSignupUser();
    await seedSignupUser(user);
    await signupDbService().markSignupUserDeletionPending(user.signupUserId);
    await signupDbService().completeSignupUserDeletion(user.signupUserId);

    await expect(
      signupDbService().markSignupUserDeletionPending(user.signupUserId),
    ).resolves.toBeUndefined();
  });

  it("throws when the user does not exist", async () => {
    await expect(
      signupDbService().markSignupUserDeletionPending(
        generateId<SignupUserId>(),
      ),
    ).rejects.toThrow();
  });
});

describe("completeSignupUserDeletion", () => {
  it("hard-deletes the row and records the deletion in the registry", async () => {
    const user = makeSignupUser();
    await seedSignupUser(user);
    await signupDbService().markSignupUserDeletionPending(user.signupUserId);

    await signupDbService().completeSignupUserDeletion(user.signupUserId);

    await expect(getRow(user.signupUserId)).resolves.toBeUndefined();
    await expect(
      signupDbService().getSignupUserDeletion(user.signupUserId),
    ).resolves.toEqual({
      deletedAt: expect.any(Date),
      signupUserId: user.signupUserId,
    });
  });

  it("is idempotent: completing an already-deleted user is a no-op", async () => {
    const user = makeSignupUser();
    await seedSignupUser(user);
    await signupDbService().markSignupUserDeletionPending(user.signupUserId);
    await signupDbService().completeSignupUserDeletion(user.signupUserId);

    await expect(
      signupDbService().completeSignupUserDeletion(user.signupUserId),
    ).resolves.toBeUndefined();
  });

  it("throws when the user is not DeletionPending, leaving the row intact", async () => {
    const user = makeSignupUser();
    await seedSignupUser(user);

    await expect(
      signupDbService().completeSignupUserDeletion(user.signupUserId),
    ).rejects.toThrow();

    await expect(getRow(user.signupUserId)).resolves.toBeDefined();
    await expect(
      signupDbService().getSignupUserDeletion(user.signupUserId),
    ).resolves.toBeUndefined();
  });

  it("throws when the user does not exist", async () => {
    await expect(
      signupDbService().completeSignupUserDeletion(generateId<SignupUserId>()),
    ).rejects.toThrow();
  });

  it("frees the unique identifiers: the same person can sign up again", async () => {
    const user = makeSignupUser();
    await seedSignupUser(user);
    await signupDbService().markSignupUserDeletionPending(user.signupUserId);
    await signupDbService().completeSignupUserDeletion(user.signupUserId);

    const sameIdentifiers = makeSignupUser(
      { email: user.email },
      { spidCode: user.spidCode },
    );

    await expect(seedSignupUser(sameIdentifiers)).resolves.toBeUndefined();
  });
});

describe("getUniqueSignupUserByIdentifiers", () => {
  it("does not match deleted users: their row is gone", async () => {
    const user = makeSignupUser();
    await seedSignupUser(user);
    await signupDbService().markSignupUserDeletionPending(user.signupUserId);
    await signupDbService().completeSignupUserDeletion(user.signupUserId);

    const found = await signupDbService().getUniqueSignupUserByIdentifiers({
      fiscalNumber: user.fiscalNumber,
      spidCode: user.spidCode,
    });

    expect(found).toBeUndefined();
  });
});
