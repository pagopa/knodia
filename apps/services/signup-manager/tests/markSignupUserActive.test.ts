import { generateId, type SignupUserId } from "@knodia/common-models/ids";
import {
  type SignupDbService,
  signupDbServiceBuilder,
} from "@knodia/db-signup/services";
import { beforeEach, describe, expect, it } from "vitest";

import { signupDb } from "./setup.ts";
import { makeSignupUser, seedSignupUser } from "./utils.ts";

// Build per test: signupDb is undefined until testcontainer setup runs.
let dbService: SignupDbService;

beforeEach(() => {
  dbService = signupDbServiceBuilder(signupDb);
});

describe("markSignupUserActive", () => {
  it("promotes an OnboardingPending user to Active and bumps updatedAt", async () => {
    const user = makeSignupUser({ status: "OnboardingPending" });
    await seedSignupUser(user);

    await dbService.markSignupUserActive(user.signupUserId);

    const row = await dbService.getSignupUserById(user.signupUserId);
    expect(row?.status).toBe("Active");
    expect(row?.updatedAt.getTime()).toBeGreaterThan(user.updatedAt.getTime());
  });

  it("is an idempotent no-op when the user is already Active (Kafka redelivery)", async () => {
    const user = makeSignupUser({ status: "Active" });
    await seedSignupUser(user);

    await expect(
      dbService.markSignupUserActive(user.signupUserId),
    ).resolves.toBeUndefined();

    const row = await dbService.getSignupUserById(user.signupUserId);
    expect(row?.status).toBe("Active");
    expect(row?.updatedAt.getTime()).toBe(user.updatedAt.getTime());
  });

  it.each(["Suspended", "DeletionPending"] as const)(
    "skips (without throwing) when the user moved on to %s",
    async (status) => {
      const user = makeSignupUser({ status });
      await seedSignupUser(user);

      await expect(
        dbService.markSignupUserActive(user.signupUserId),
      ).resolves.toBeUndefined();

      const row = await dbService.getSignupUserById(user.signupUserId);
      expect(row?.status).toBe(status);
    },
  );

  it("is a no-op when the row is gone but the deletion was recorded (replay after erasure)", async () => {
    const user = makeSignupUser({ status: "OnboardingPending" });
    await seedSignupUser(user);
    await dbService.markSignupUserDeletionPending(user.signupUserId);
    await dbService.completeSignupUserDeletion(user.signupUserId);

    await expect(
      dbService.markSignupUserActive(user.signupUserId),
    ).resolves.toBeUndefined();
  });

  it("throws when the user is unknown and no deletion is recorded", async () => {
    await expect(
      dbService.markSignupUserActive(generateId<SignupUserId>()),
    ).rejects.toThrow();
  });
});
