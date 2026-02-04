import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "crypto";

export type FileManager = ReturnType<typeof initFileManager>;

export function initFileManager() {
  const client = new S3Client();

  const buildS3Key = (
    path: string,
    resourceId: string | undefined,
    fileName: string,
  ): string =>
    [path, resourceId, fileName].filter((s) => s && s.length > 0).join("/");

  return {
    storeBytes: async (s3File: {
      bucket: string;
      content: Buffer;
      name: string;
      path: string;
      resourceId?: string;
    }): Promise<string> => {
      const key = buildS3Key(s3File.path, s3File.resourceId, s3File.name);

      await client.send(
        new PutObjectCommand({
          Body: s3File.content,
          Bucket: s3File.bucket,
          ChecksumSHA256: crypto
            .createHash("sha256")
            .update(s3File.content)
            .digest("base64")
            .toString(),
          Key: key,
        }),
      );
      return key;
    },
  };
}
