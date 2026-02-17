import { HTTPServerConfig } from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import z from "zod";

const BffProcessConfig = LoggerConfig.and(HTTPServerConfig).and(
  z
    .object({
      ESERVICE_INTERFACES_S3_BUCKET: z.string(),
      ESERVICE_PROCESS_URL: z.url(),
      REMOTE_RESOURCES_MANAGER_URL: z.url(),
    })
    .transform((c) => ({
      eserviceInterfacesS3Bucket: c.ESERVICE_INTERFACES_S3_BUCKET,
      eserviceProcessUrl: c.ESERVICE_PROCESS_URL,
      remoteResourcesManagerUrl: c.REMOTE_RESOURCES_MANAGER_URL,
    })),
);
export type BffProcessConfig = z.infer<typeof BffProcessConfig>;

export const config = BffProcessConfig.parse(process.env);
