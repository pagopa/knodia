import { z } from "zod";

import { type SignalHubSeedConfig } from "./rotation.ts";

// SIGNAL_HUB_SEED_* env vars drive the periodId / seed rotation that both the
// HTTP handlers (`/residence`, `/pseudonymization`) and the in-process Signal
// Hub emitter read from. Co-located so they can't drift.
export const SignalHubSeedEnvConfig = z
  .object({
    SIGNAL_HUB_SEED_EXPIRE_SECONDS: z.coerce.number().int().positive(),
    SIGNAL_HUB_SEED_SALT_LENGTH: z.coerce.number().int().positive(),
    SIGNAL_HUB_SEED_START_DATE_MS: z.coerce
      .number()
      .int()
      .nonnegative()
      .refine((ms) => ms <= Date.now(), {
        message:
          "SIGNAL_HUB_SEED_START_DATE_MS must not be in the future — periodId would go negative.",
      }),
  })
  .transform((c) => ({
    signalHubSeedExpireSeconds: c.SIGNAL_HUB_SEED_EXPIRE_SECONDS,
    signalHubSeedSaltLength: c.SIGNAL_HUB_SEED_SALT_LENGTH,
    signalHubSeedStartDateMs: c.SIGNAL_HUB_SEED_START_DATE_MS,
  }));

export type SignalHubSeedEnvConfig = z.infer<typeof SignalHubSeedEnvConfig>;

export function toSignalHubSeedConfig(
  envConfig: SignalHubSeedEnvConfig,
): SignalHubSeedConfig {
  return {
    expireSeconds: envConfig.signalHubSeedExpireSeconds,
    saltLength: envConfig.signalHubSeedSaltLength,
    startDateMs: envConfig.signalHubSeedStartDateMs,
  };
}
