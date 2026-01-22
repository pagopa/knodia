import { HTTPServerConfig } from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import z from "zod";

const BffProcessConfig = LoggerConfig.and(HTTPServerConfig).and(
  z
    .object({
      ESERVICE_PROCESS_URL: z.url(),
    })
    .transform((c) => ({
      eserviceProcessUrl: c.ESERVICE_PROCESS_URL,
    })),
);
type BffProcessConfig = z.infer<typeof BffProcessConfig>;

export const config = BffProcessConfig.parse(process.env);
