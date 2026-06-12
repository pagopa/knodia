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
  return match(event)
    .with({ type: "OnboardingCompletedV1" }, async ({ data }) => {
      const {
        occurredAt,
        oneIdNonce,
        signupUserId,
        termsAcceptanceDigest,
        termsAcceptanceVersion,
      } = data;

      if (!SAFE_NONCE.test(oneIdNonce)) {
        throw genericInternalError(
          `Unsafe oneIdNonce for signup user ${signupUserId}`,
        );
      }

      const record: SignupArchiveRecord = SignupArchiveRecord.parse({
        action: "Onboarding",
        date: occurredAt,
        nonce: oneIdNonce,
        termsAcceptanceDigest,
        termsAcceptanceVersion,
      });

      const content = Buffer.from(JSON.stringify(record), "utf8");
      const key = `signup-actions/${signupUserId}/Onboarding/${oneIdNonce}.json`;

      // The record is keyed by oneIdNonce and its content is fully derived from
      // the (immutable) event, so the same key always maps to identical bytes —
      // which is why an If-None-Match skip is safe. Legal immutability of the
      // written object is enforced by the bucket's Object Lock / retention
      // config (infra), not by this service.
      const { alreadyExists } = await deps.fileManager.storeBytesIfAbsent({
        bucket: deps.bucket,
        checksumSHA256Hex: createHash("sha256").update(content).digest("hex"),
        content,
        contentType: "application/json",
        key,
      });

      if (alreadyExists) {
        logger.warn(
          `Onboarding action already archived for signup user ${signupUserId}; skipping re-write`,
        );
      } else {
        logger.info(
          `Archived Onboarding action for signup user ${signupUserId}`,
        );
      }
    })
    .with({ type: "EmailChangeRequestedV1" }, async () => {
      logger.info(
        `Received EmailChangeRequestedV1 event; No archival action defined, skipping`,
      );
    })
    .with({ type: "DeletionRequestedV1" }, ({ data }) => {
      // No-op: archiving the deletion action is implemented in a follow-up task.
      logger.info(
        `Ignoring DeletionRequestedV1 for signup user ${data.signupUserId}: handling not implemented yet`,
      );
    })
    .exhaustive();
}
