import { HTTPServerConfig } from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const ApiGatewayConfig = LoggerConfig.and(HTTPServerConfig).and(
  z
    .object({
      ESERVICE_PROCESS_URL: z.url(),
    })
    .transform((c) => ({
      eserviceProcessUrl: c.ESERVICE_PROCESS_URL,
    })),
);

export type ApiGatewayConfig = z.infer<typeof ApiGatewayConfig>;

export const config = ApiGatewayConfig.parse(process.env);
