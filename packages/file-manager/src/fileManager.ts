import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { genericInternalError } from "@knodia/common-models/errors";

export type FileManager = ReturnType<typeof initFileManager>;

interface S3File {
  bucket: string;
  checksumSHA256Hex: string;
  content: Buffer;
  contentType: string;
  key: string;
}

export function initFileManager(s3Client?: S3Client) {
  const client = s3Client ?? new S3Client();

  return {
    getBytes: async (s3File: {
      bucket: string;
      key: string;
    }): Promise<{ content: Buffer; contentType: string }> => {
      const response = await client.send(
        new GetObjectCommand({
          Bucket: s3File.bucket,
          Key: s3File.key,
        }),
      );
      if (!response.Body) {
        throw genericInternalError(
          `Empty response body for key: ${s3File.key} in bucket: ${s3File.bucket}`,
        );
      }
      const byteArray = await response.Body.transformToByteArray();
      return {
        content: Buffer.from(byteArray),
        contentType: response.ContentType ?? "application/octet-stream",
      };
    },
    storeBytes: async (s3File: S3File): Promise<string> => {
      await client.send(buildPutObjectCommand(s3File));
      return s3File.key;
    },
    // If-None-Match: * makes a pre-existing key answer 412, which we report as
    // alreadyExists so callers stay idempotent (e.g. Kafka reprocess) without
    // creating a new object version. Any other S3 error is rethrown.
    // Note: a 412 is NOT compared against the existing object — callers must
    // guarantee that a given key always maps to identical content.
    storeBytesIfAbsent: async (
      s3File: S3File,
    ): Promise<{ alreadyExists: boolean; key: string }> => {
      const command = buildPutObjectCommand(s3File, { ifNoneMatch: true });

      try {
        await client.send(command);
        return { alreadyExists: false, key: s3File.key };
      } catch (error) {
        if (isPreconditionFailed(error)) {
          return { alreadyExists: true, key: s3File.key };
        }
        throw error;
      }
    },
  };
}

// The only per-caller difference is IfNoneMatch, so it stays a parameter
// rather than splitting into two near-identical builders.
function buildPutObjectCommand(
  s3File: S3File,
  { ifNoneMatch = false }: { ifNoneMatch?: boolean } = {},
): PutObjectCommand {
  const checksumBytes = Buffer.from(s3File.checksumSHA256Hex, "hex");
  if (checksumBytes.length !== 32) {
    throw genericInternalError(
      `Invalid SHA-256 hex checksum: expected 64 hex characters, got "${s3File.checksumSHA256Hex}"`,
    );
  }

  return new PutObjectCommand({
    Body: s3File.content,
    Bucket: s3File.bucket,
    ChecksumSHA256: checksumBytes.toString("base64"),
    ContentType: s3File.contentType,
    ...(ifNoneMatch ? { IfNoneMatch: "*" } : {}),
    Key: s3File.key,
  });
}

// S3 does not model a dedicated PreconditionFailed exception for PutObject, and
// MinIO surfaces it generically, so we match on name/status rather than a
// typed error class.
function isPreconditionFailed(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const { $metadata, name } = error as {
    $metadata?: { httpStatusCode?: number };
    name?: string;
  };
  return name === "PreconditionFailed" || $metadata?.httpStatusCode === 412;
}
