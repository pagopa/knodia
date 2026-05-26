import { SignalHubDbConfig } from "@knodia/db-signal-hub/config";
import { LoggerConfig } from "@knodia/logger/config";
import z from "zod";

const SignalHubCleanerConfig = LoggerConfig.and(SignalHubDbConfig).and(
  z
    .object({
      SIGNALS_RETENTION_HOURS: z.coerce.number().int().positive(),
    })
    .transform((c) => ({
      signalsRetentionHours: c.SIGNALS_RETENTION_HOURS,
    })),
);
type SignalHubCleanerConfig = z.infer<typeof SignalHubCleanerConfig>;

export const config = SignalHubCleanerConfig.parse(process.env);
