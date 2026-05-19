import { signalHubDbConfig } from "@knodia/db-signal-hub/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const SeedConfig = z
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

const CronJobConfig = LoggerConfig.and(SeedConfig);

export const config = {
  ...CronJobConfig.parse(process.env),
  ...signalHubDbConfig,
};
