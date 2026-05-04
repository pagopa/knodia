import { env } from "node:process";
import { z } from "zod";

const SignalHubStoreDbConfig = z
  .object({
    SIGNAL_HUB_STORE_DB_HOST: z.string(),
    SIGNAL_HUB_STORE_DB_NAME: z.string(),
    SIGNAL_HUB_STORE_DB_PASSWORD: z.string(),
    SIGNAL_HUB_STORE_DB_PORT: z.coerce.number().int().min(1024).max(65535),
    SIGNAL_HUB_STORE_DB_SCHEMA: z.string(),
    SIGNAL_HUB_STORE_DB_USE_SSL: z.stringbool(),
    SIGNAL_HUB_STORE_DB_USER: z.string(),
  })
  .transform((c) => ({
    signalHubStoreDbHost: c.SIGNAL_HUB_STORE_DB_HOST,
    signalHubStoreDbName: c.SIGNAL_HUB_STORE_DB_NAME,
    signalHubStoreDbPassword: c.SIGNAL_HUB_STORE_DB_PASSWORD,
    signalHubStoreDbPort: c.SIGNAL_HUB_STORE_DB_PORT,
    signalHubStoreDbSchema: c.SIGNAL_HUB_STORE_DB_SCHEMA,
    signalHubStoreDbUser: c.SIGNAL_HUB_STORE_DB_USER,
    signalHubStoreDbUseSsl: c.SIGNAL_HUB_STORE_DB_USE_SSL,
  }));
type SignalHubStoreDbConfig = z.infer<typeof SignalHubStoreDbConfig>;

export const signalHubStoreDbConfig: SignalHubStoreDbConfig =
  SignalHubStoreDbConfig.parse(env);
