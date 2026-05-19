import { z } from "zod";

// Shared SEED_* env-var schema for the producer (mock-eservice) and the
// cron job. Both compute the periodId / seed from these inputs and MUST
// agree on the values — otherwise a consumer can't decode the cron's
// `object_id` against the producer's `/pseudonymization` seed.
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
