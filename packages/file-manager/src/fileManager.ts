import {
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import crypto from "crypto";

import type { FileManagerConfig } from "../config/config.ts";

export function initFileManager(config: FileManagerConfig) {
  const s3ClientConfig: S3ClientConfig = {
    endpoint: config.s3CustomServerUri,
    forcePathStyle: config.s3CustomServerUri !== undefined,
  };
  const client = new S3Client(s3ClientConfig);

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
