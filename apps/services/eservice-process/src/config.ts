import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

export const EserviceProcessConfig = LoggerConfig.and(
  z
    .object({
      HOST: z.string().default("0.0.0.0"),
      PORT: z.coerce.number().int().min(1024).max(65535).default(3000),
      SERVICE_NAME: z.string().default("eservice-process"),
    })
    .transform((c) => ({
      host: c.HOST,
      port: c.PORT,
      serviceName: c.SERVICE_NAME,
    })),
);

export type EserviceProcessConfig = z.infer<typeof EserviceProcessConfig>;

export const config = EserviceProcessConfig.parse(process.env);
