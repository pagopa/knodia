import { HTTPServerConfig } from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const K2KGatewayConfig = LoggerConfig.and(HTTPServerConfig).and(
  z
    .object({
      ESERVICE_PROCESS_URL: z.url(),
    })
    .transform((c) => ({
      eserviceProcessUrl: c.ESERVICE_PROCESS_URL,
    })),
);

export type K2KGatewayConfig = z.infer<typeof K2KGatewayConfig>;

export const config = K2KGatewayConfig.parse(process.env);
