import { SignupUserId } from "@knodia/common-models/ids";
import { type FileManager } from "@knodia/file-manager";
import { type SignupEventV1 } from "@knodia/signup-models";
import { type Logger } from "pino";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  handleSignupMessage,
  type SignupArchiverDeps,
} from "../src/services/consumerService.ts";

const signupUserId = SignupUserId.parse("11111111-1111-4111-8111-111111111111");
const digest = "a".repeat(64);

function makeDeletionEvent(
  overrides: Partial<
    Extract<SignupEventV1, { type: "DeletionRequestedV1" }>["data"]
  > = {},
): SignupEventV1 {
  return {
    data: {
      occurredAt: "2026-06-09T10:00:00.000Z",
      oneIdNonce: "nonce-abc",
      signupUserId,
      ...overrides,
    },
    type: "DeletionRequestedV1",
  };
}

function makeOnboardingEvent(
  overrides: Partial<
    Extract<SignupEventV1, { type: "OnboardingCompletedV1" }>["data"]
  > = {},
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

let storeBytesIfAbsent: ReturnType<typeof vi.fn>;
let logger: Logger;
let deps: SignupArchiverDeps;

function makeSuspensionEvent(
  overrides: Partial<
    Extract<SignupEventV1, { type: "SuspensionRequestedV1" }>["data"]
  > = {},
): Extract<SignupEventV1, { type: "SuspensionRequestedV1" }> {
  return {
    data: {
      occurredAt: "2026-06-09T11:00:00.000Z",
      oneIdNonce: "nonce-susp-abc",
      signupUserId,
      suspensionReason: "UnlawfulProcessing",
      ...overrides,
    },
    type: "SuspensionRequestedV1",
  };
}

beforeEach(() => {
  storeBytesIfAbsent = vi
    .fn()
    .mockResolvedValue({ alreadyExists: false, key: "k" });
  logger = { info: vi.fn(), warn: vi.fn() } as unknown as Logger;
  deps = {
    bucket: "test-bucket",
    fileManager: { storeBytesIfAbsent } as unknown as FileManager,
  };
});

function firstStoreArg() {
  const call = storeBytesIfAbsent.mock.calls.at(0);
  if (!call) {
    throw new Error("storeBytesIfAbsent was not called");
  }
  return call[0];
}

describe("handleSignupMessage - OnboardingCompletedV1", () => {
  it("archives the onboarding action to the expected key with no leftover PII", async () => {
    await handleSignupMessage(makeOnboardingEvent(), deps, logger);

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
      termsAcceptanceDigest: digest,
      termsAcceptanceVersion: "v1",
    });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Archived Onboarding"),
    );
  });

  it("rejects an unsafe nonce before touching S3", async () => {
    await expect(
      handleSignupMessage(
        makeOnboardingEvent({ oneIdNonce: "../etc/passwd" }),
        deps,
        logger,
      ),
    ).rejects.toThrow(/Unsafe oneIdNonce/);
    expect(storeBytesIfAbsent).not.toHaveBeenCalled();
  });

  it("treats an already-archived record as an idempotent skip", async () => {
    storeBytesIfAbsent.mockResolvedValue({ alreadyExists: true, key: "k" });

    await handleSignupMessage(makeOnboardingEvent(), deps, logger);

    expect(storeBytesIfAbsent).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("already archived"),
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it("propagates non-412 S3 failures", async () => {
    storeBytesIfAbsent.mockRejectedValue(new Error("AccessDenied"));

    await expect(
      handleSignupMessage(makeOnboardingEvent(), deps, logger),
    ).rejects.toThrow(/AccessDenied/);
  });
});

describe("handleSignupMessage - DeletionRequestedV1", () => {
  it("archives the deletion action to the expected key, built only from the message", async () => {
    await handleSignupMessage(makeDeletionEvent(), deps, logger);

    expect(storeBytesIfAbsent).toHaveBeenCalledTimes(1);
    const arg = firstStoreArg();
    expect(arg.bucket).toBe("test-bucket");
    expect(arg.key).toBe(
      `signup-actions/${signupUserId}/Deletion/nonce-abc.json`,
    );
    expect(arg.contentType).toBe("application/json");

    // No PII, no One Identity id: the record carries only fields lifted from
    // the event payload.
    expect(JSON.parse(arg.content.toString())).toEqual({
      action: "Deletion",
      date: "2026-06-09T10:00:00.000Z",
      nonce: "nonce-abc",
    });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Archived Deletion"),
    );
  });

  it("rejects an unsafe nonce before touching S3", async () => {
    await expect(
      handleSignupMessage(
        makeDeletionEvent({ oneIdNonce: "../etc/passwd" }),
        deps,
        logger,
      ),
    ).rejects.toThrow(/Unsafe oneIdNonce/);
    expect(storeBytesIfAbsent).not.toHaveBeenCalled();
  });

  it("treats a replayed deletion as an idempotent skip without a new S3 version", async () => {
    storeBytesIfAbsent.mockResolvedValue({ alreadyExists: true, key: "k" });

    await handleSignupMessage(makeDeletionEvent(), deps, logger);

    expect(storeBytesIfAbsent).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("already archived"),
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it("propagates non-412 S3 failures", async () => {
    storeBytesIfAbsent.mockRejectedValue(new Error("AccessDenied"));

    await expect(
      handleSignupMessage(makeDeletionEvent(), deps, logger),
    ).rejects.toThrow(/AccessDenied/);
  });
});

describe("handleSignupMessage - SuspensionRequestedV1", () => {
  let storeBytesIfAbsent: ReturnType<typeof vi.fn>;
  let logger: Logger;
  let deps: SignupArchiverDeps;

  beforeEach(() => {
    storeBytesIfAbsent = vi
      .fn()
      .mockResolvedValue({ alreadyExists: false, key: "k" });
    logger = { info: vi.fn(), warn: vi.fn() } as unknown as Logger;
    deps = {
      bucket: "test-bucket",
      fileManager: { storeBytesIfAbsent } as unknown as FileManager,
    };
  });

  function firstStoreArg() {
    const call = storeBytesIfAbsent.mock.calls.at(0);
    if (!call) {
      throw new Error("storeBytesIfAbsent was not called");
    }
    return call[0];
  }

  it("archives the suspension action to the expected key", async () => {
    await handleSignupMessage(makeSuspensionEvent(), deps, logger);

    expect(storeBytesIfAbsent).toHaveBeenCalledTimes(1);
    const arg = firstStoreArg();
    expect(arg.bucket).toBe("test-bucket");
    expect(arg.key).toBe(
      `signup-actions/${signupUserId}/Suspension/nonce-susp-abc.json`,
    );
    expect(arg.contentType).toBe("application/json");

    expect(JSON.parse(arg.content.toString())).toEqual({
      action: "Suspension",
      date: "2026-06-09T11:00:00.000Z",
      nonce: "nonce-susp-abc",
      reason: "UnlawfulProcessing",
    });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Archived Suspension"),
    );
  });

  it("rejects an unsafe nonce before touching S3", async () => {
    await expect(
      handleSignupMessage(
        makeSuspensionEvent({ oneIdNonce: "../etc/passwd" }),
        deps,
        logger,
      ),
    ).rejects.toThrow(/Unsafe oneIdNonce/);
    expect(storeBytesIfAbsent).not.toHaveBeenCalled();
  });

  it("treats an already-archived suspension record as an idempotent skip", async () => {
    storeBytesIfAbsent.mockResolvedValue({ alreadyExists: true, key: "k" });

    await handleSignupMessage(makeSuspensionEvent(), deps, logger);

    expect(storeBytesIfAbsent).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("already archived"),
    );
    expect(logger.info).not.toHaveBeenCalled();
  });

  it("propagates storage failures", async () => {
    storeBytesIfAbsent.mockRejectedValue(new Error("AccessDenied"));

    await expect(
      handleSignupMessage(makeSuspensionEvent(), deps, logger),
    ).rejects.toThrow(/AccessDenied/);
  });
});
