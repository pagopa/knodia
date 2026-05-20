import { z } from "zod";

// SEED_* env vars drive the periodId / seed rotation that both the HTTP
// handlers (`/residence`, `/pseudonymization`) and the in-process Signal
// Hub emitter read from. Co-located so they can't drift.
export const SignalHubSeedEnvConfig = z
  .object({
    SEED_EXPIRE_SECONDS: z.coerce.number().int().positive(),
    SEED_SALT_LENGTH: z.coerce.number().int().positive(),
    SEED_START_DATE_MS: z.coerce
      .number()
      .int()
      .nonnegative()
      .refine((ms) => ms <= Date.now(), {
        message:
          "SEED_START_DATE_MS must not be in the future — periodId would go negative.",
      }),
  })
  .transform((c) => ({
    seedExpireSeconds: c.SEED_EXPIRE_SECONDS,
    seedSaltLength: c.SEED_SALT_LENGTH,
    seedStartDateMs: c.SEED_START_DATE_MS,
  }));

export type SignalHubSeedEnvConfig = z.infer<typeof SignalHubSeedEnvConfig>;
