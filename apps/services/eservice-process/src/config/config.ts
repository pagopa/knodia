import { EventStoreEserviceConfig } from "@knodia/db-event-store-eservice/config";
import { HTTPServerConfig } from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const EserviceProcessConfig = LoggerConfig.and(HTTPServerConfig).and(
  EventStoreEserviceConfig,
);
export type EserviceProcessConfig = z.infer<typeof EserviceProcessConfig>;

export const config = EserviceProcessConfig.parse(process.env);
