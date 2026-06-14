import type { SignupUserId } from "@knodia/common-models/ids";
import type { FileManager } from "@knodia/file-manager";
import type { SignupEventV1 } from "@knodia/signup-models";
import type { Logger } from "pino";

import { genericInternalError } from "@knodia/common-models/errors";
import { createHash } from "node:crypto";
import { match } from "ts-pattern";

import { SignupArchiveRecord } from "../models/signupArchiveRecord.ts";

export interface SignupArchiverDeps {
  bucket: string;
  fileManager: FileManager;
}

// The nonce becomes a literal S3 path segment, so it must not contain slashes,
// whitespace or other characters that would alter the logical key layout.
const SAFE_NONCE = /^[A-Za-z0-9._-]+$/;

// PROTOTYPE LIMITATION: errors thrown here are treated by the consumer as
// retryable (offsets commit only on success, see runConsumer), so a permanent
// data fault — e.g. an unsafe nonce — becomes a poison message that is
// retried forever and blocks its partition.
// A real quarantine/DLQ for permanent failures needs to be implemented to handle these.
export async function handleSignupMessage(
  event: SignupEventV1,
  deps: SignupArchiverDeps,
  logger: Logger,
): Promise<void> {
  // The nonce is only carried by the archived action variants (Onboarding,
  // Deletion); EmailChangeRequestedV1 has no nonce and no archival action, so
  // it is validated inside each archiving arm rather than once before the match.
  const record: SignupArchiveRecord | undefined = match(event)
    .with({ type: "OnboardingCompletedV1" }, ({ data }) => {
      assertSafeNonce(data.oneIdNonce, data.signupUserId);
      return SignupArchiveRecord.parse({
        action: "Onboarding",
        date: data.occurredAt,
        nonce: data.oneIdNonce,
        termsAcceptanceDigest: data.termsAcceptanceDigest,
        termsAcceptanceVersion: data.termsAcceptanceVersion,
      });
    })
    .with({ type: "DeletionRequestedV1" }, ({ data }) => {
      assertSafeNonce(data.oneIdNonce, data.signupUserId);
      return SignupArchiveRecord.parse({
        action: "Deletion",
        date: data.occurredAt,
        nonce: data.oneIdNonce,
      });
    })
    .with({ type: "EmailChangeRequestedV1" }, () => {
      logger.info(
        `Received EmailChangeRequestedV1 event; No archival action defined, skipping`,
      );
      return undefined;
    })
    .exhaustive();

  if (record) {
    await archiveAction(
      record,
      event.data.signupUserId,
      record.nonce,
      deps,
      logger,
    );
  }
}

// The record content is fully derived from the (immutable) event, so a given
// {signupUserId, action, nonce} always maps to identical bytes — which is why
// the If-None-Match skip in storeBytesIfAbsent is safe (a Kafka reprocess
// re-writes the same object instead of creating a new version). Legal
// immutability of the written object is enforced by the bucket's Object Lock /
// retention config (infra), not by this service.
async function archiveAction(
  record: SignupArchiveRecord,
  signupUserId: SignupUserId,
  nonce: string,
  deps: SignupArchiverDeps,
  logger: Logger,
): Promise<void> {
  const content = Buffer.from(JSON.stringify(record), "utf8");
  const key = `signup-actions/${signupUserId}/${record.action}/${nonce}.json`;

  const { alreadyExists } = await deps.fileManager.storeBytesIfAbsent({
    bucket: deps.bucket,
    checksumSHA256Hex: createHash("sha256").update(content).digest("hex"),
    content,
    contentType: "application/json",
    key,
  });

  if (alreadyExists) {
    logger.warn(
      `${record.action} action already archived for signup user ${signupUserId}; skipping re-write`,
    );
  } else {
    logger.info(
      `Archived ${record.action} action for signup user ${signupUserId}`,
    );
  }
}

function assertSafeNonce(nonce: string, signupUserId: SignupUserId): void {
  if (!SAFE_NONCE.test(nonce)) {
    throw genericInternalError(
      `Unsafe oneIdNonce for signup user ${signupUserId}`,
    );
  }
}
