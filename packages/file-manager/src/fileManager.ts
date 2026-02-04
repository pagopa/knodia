import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "crypto";

export type FileManager = ReturnType<typeof initFileManager>;

export function initFileManager() {
  const client = new S3Client();

  return {
    storeBytes: async (s3File: {
      bucket: string;
      checksum?: string;
      content: Buffer;
      contentType: string;
      key: string;
    }): Promise<string> => {
      await client.send(
        new PutObjectCommand({
          Body: s3File.content,
          Bucket: s3File.bucket,
          ChecksumSHA256:
            s3File.checksum ??
            crypto.createHash("sha256").update(s3File.content).digest("base64"),
          ContentType: s3File.contentType,
          Key: s3File.key,
        }),
      );
      return s3File.key;
    },
  };
}
