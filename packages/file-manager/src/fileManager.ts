import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { genericInternalError } from "@knodia/common-models/errors";

export type FileManager = ReturnType<typeof initFileManager>;

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
    storeBytes: async (s3File: {
      bucket: string;
      checksumSHA256Hex: string;
      content: Buffer;
      contentType: string;
      key: string;
    }): Promise<string> => {
      const checksumBytes = Buffer.from(s3File.checksumSHA256Hex, "hex");
      if (checksumBytes.length !== 32) {
        throw genericInternalError(
          `Invalid SHA-256 hex checksum: expected 64 hex characters, got "${s3File.checksumSHA256Hex}"`,
        );
      }

      await client.send(
        new PutObjectCommand({
          Body: s3File.content,
          Bucket: s3File.bucket,
          ChecksumSHA256: checksumBytes.toString("base64"),
          ContentType: s3File.contentType,
          Key: s3File.key,
        }),
      );
      return s3File.key;
    },
  };
}
