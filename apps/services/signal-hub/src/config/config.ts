import { ReadmodelEserviceConfig } from "@knodia/db-readmodel-eservice/config";
import { SignalHubDbConfig } from "@knodia/db-signal-hub/config";
import { HTTPServerConfig } from "@knodia/fastify-zod-api-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import z from "zod";

const SignalHubConfig = LoggerConfig.and(HTTPServerConfig)
  .and(ReadmodelEserviceConfig)
  .and(SignalHubDbConfig)
  .and(
    z
      .object({
        TIME_WINDOW_IN_SECONDS: z.coerce.number().int().positive(),
      })
      .transform((c) => ({
        timeWindowInSeconds: c.TIME_WINDOW_IN_SECONDS,
      })),
  );
export type SignalHubConfig = z.infer<typeof SignalHubConfig>;

export const config = SignalHubConfig.parse(process.env);
