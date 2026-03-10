import { z } from "zod";

export const FileManagerConfig = z
  .object({
    ESERVICE_INTERFACES_S3_BUCKET: z.string(),
  })
  .transform((c) => ({
    eserviceInterfacesS3Bucket: c.ESERVICE_INTERFACES_S3_BUCKET,
  }));

export type FileManagerConfig = z.infer<typeof FileManagerConfig>;
