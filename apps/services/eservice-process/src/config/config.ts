import { EventStoreEserviceConfig } from "@knodia/db-event-store-eservice/config";
import { ReadmodelEserviceConfig } from "@knodia/db-readmodel-eservice/config";
import {
  AuthConfig,
  HTTPServerConfig,
} from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const EserviceProcessConfig = LoggerConfig.and(HTTPServerConfig)
  .and(AuthConfig)
  .and(EventStoreEserviceConfig)
  .and(ReadmodelEserviceConfig)
  .and(
    z
      .object({
        ESERVICE_INTERFACES_S3_BUCKET: z.string(),
      })
      .transform((c) => ({
        eserviceInterfacesS3Bucket: c.ESERVICE_INTERFACES_S3_BUCKET,
      })),
  );
export type EserviceProcessConfig = z.infer<typeof EserviceProcessConfig>;

export const config = EserviceProcessConfig.parse(process.env);
