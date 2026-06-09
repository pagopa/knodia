import { SignupUserId } from "@knodia/common-models/ids";
import { type SignupDbService } from "@knodia/db-signup/services";
import { type FileManager } from "@knodia/file-manager";
import { type SignupEventV1, type SignupUser } from "@knodia/signup-models";
import { type Logger } from "pino";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  handleSignupMessage,
  type SignupArchiverDeps,
} from "../src/services/consumerService.ts";

const signupUserId = SignupUserId.parse("11111111-1111-4111-8111-111111111111");
const digest = "a".repeat(64);

function makeEvent(
  overrides: Partial<SignupEventV1["data"]> = {},
): SignupEventV1 {
  return {
    data: {
      occurredAt: "2026-06-09T10:00:00.000Z",
      oneIdNonce: "nonce-abc",
      signupUserId,
      termsAcceptanceDigest: digest,
      termsAcceptanceVersion: "v1",
      ...overrides,
    },
    type: "OnboardingCompletedV1",
  };
}

function makeUser(overrides: Partial<SignupUser> = {}): SignupUser {
  return {
    fiscalNumber: undefined,
    personIdentifier: "PERSON-1",
    signupUserId,
    spidCode: undefined,
    ...overrides,
  } as SignupUser;
}

describe("handleSignupMessage - OnboardingCompletedV1", () => {
  let storeBytesIfAbsent: ReturnType<typeof vi.fn>;
  let getSignupUserById: ReturnType<typeof vi.fn>;
  let logger: Logger;
  let deps: SignupArchiverDeps;

  beforeEach(() => {
    storeBytesIfAbsent = vi
      .fn()
      .mockResolvedValue({ alreadyExists: false, key: "k" });
    getSignupUserById = vi.fn().mockResolvedValue(makeUser());
    logger = { info: vi.fn(), warn: vi.fn() } as unknown as Logger;
    deps = {
      bucket: "test-bucket",
      fileManager: { storeBytesIfAbsent } as unknown as FileManager,
      signupDbService: { getSignupUserById } as unknown as SignupDbService,
    };
  });

  function firstStoreArg() {
    const call = storeBytesIfAbsent.mock.calls.at(0);
    if (!call) {
      throw new Error("storeBytesIfAbsent was not called");
    }
    return call[0];
  }

  it("archives the onboarding action to the expected key with no leftover PII", async () => {
    await handleSignupMessage(makeEvent(), deps, logger);

    expect(storeBytesIfAbsent).toHaveBeenCalledTimes(1);
    const arg = firstStoreArg();
    expect(arg.bucket).toBe("test-bucket");
    expect(arg.key).toBe(
      `signup-actions/${signupUserId}/Onboarding/nonce-abc.json`,
    );
    expect(arg.contentType).toBe("application/json");

    expect(JSON.parse(arg.content.toString())).toEqual({
      action: "Onboarding",
      date: "2026-06-09T10:00:00.000Z",
      nonce: "nonce-abc",
      oneIdentityId: "PERSON-1",
      termsAcceptanceDigest: digest,
      termsAcceptanceVersion: "v1",
    });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Archived Onboarding"),
    );
  });

  it("resolves oneIdentityId by precedence personIdentifier > spidCode > fiscalNumber", async () => {
    getSignupUserById.mockResolvedValue(
      makeUser({ personIdentifier: undefined, spidCode: "SPID-9" }),
    );

    await handleSignupMessage(makeEvent(), deps, logger);

    const record = JSON.parse(firstStoreArg().content.toString());
    expect(record.oneIdentityId).toBe("SPID-9");
  });

  it("throws when the signup user is not found", async () => {
    getSignupUserById.mockResolvedValue(undefined);

    await expect(
      handleSignupMessage(makeEvent(), deps, logger),
    ).rejects.toThrow(/not found/);
    expect(storeBytesIfAbsent).not.toHaveBeenCalled();
  });

  it("throws when the user has no One Identity identifier", async () => {
    getSignupUserById.mockResolvedValue(
      makeUser({
        fiscalNumber: undefined,
        personIdentifier: undefined,
        spidCode: undefined,
      }),
    );

    await expect(
      handleSignupMessage(makeEvent(), deps, logger),
    ).rejects.toThrow();
    expect(storeBytesIfAbsent).not.toHaveBeenCalled();
  });

  it("rejects an unsafe nonce before touching the DB or S3", async () => {
    await expect(
      handleSignupMessage(
        makeEvent({ oneIdNonce: "../etc/passwd" }),
        deps,
        logger,
      ),
    ).rejects.toThrow(/Unsafe oneIdNonce/);
    expect(getSignupUserById).not.toHaveBeenCalled();
    expect(storeBytesIfAbsent).not.toHaveBeenCalled();
  });

  it("treats an already-archived record as an idempotent skip", async () => {
    storeBytesIfAbsent.mockResolvedValue({ alreadyExists: true, key: "k" });

    await handleSignupMessage(makeEvent(), deps, logger);

    expect(storeBytesIfAbsent).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("already archived"),
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it("propagates non-412 S3 failures", async () => {
    storeBytesIfAbsent.mockRejectedValue(new Error("AccessDenied"));

    await expect(
      handleSignupMessage(makeEvent(), deps, logger),
    ).rejects.toThrow(/AccessDenied/);
  });
});
