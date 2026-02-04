import { z } from "zod";

export const FileManagerConfig = z
  .object({
    S3_CUSTOM_SERVER_URI: z.url().optional(),
  })
  .transform((c) => ({
    s3CustomServerUri: c.S3_CUSTOM_SERVER_URI,
  }));
export type FileManagerConfig = z.infer<typeof FileManagerConfig>;
