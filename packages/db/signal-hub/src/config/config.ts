import { env } from "node:process";
import { z } from "zod";

const SignalHubDbConfig = z
  .object({
    SIGNAL_HUB_DB_HOST: z.string(),
    SIGNAL_HUB_DB_NAME: z.string(),
    SIGNAL_HUB_DB_PASSWORD: z.string(),
    SIGNAL_HUB_DB_PORT: z.coerce.number().int().min(1024).max(65535),
    SIGNAL_HUB_DB_SCHEMA: z.string(),
    SIGNAL_HUB_DB_USE_SSL: z.stringbool(),
    SIGNAL_HUB_DB_USER: z.string(),
  })
  .transform((c) => ({
    signalHubDbHost: c.SIGNAL_HUB_DB_HOST,
    signalHubDbName: c.SIGNAL_HUB_DB_NAME,
    signalHubDbPassword: c.SIGNAL_HUB_DB_PASSWORD,
    signalHubDbPort: c.SIGNAL_HUB_DB_PORT,
    signalHubDbSchema: c.SIGNAL_HUB_DB_SCHEMA,
    signalHubDbUser: c.SIGNAL_HUB_DB_USER,
    signalHubDbUseSsl: c.SIGNAL_HUB_DB_USE_SSL,
  }));
type SignalHubDbConfig = z.infer<typeof SignalHubDbConfig>;

export const signalHubDbConfig: SignalHubDbConfig =
  SignalHubDbConfig.parse(env);
