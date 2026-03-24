import z from "zod";

export const PollingConfig = z
  .object({
    DEFAULT_POLLING_MAX_RETRIES: z.coerce.number().default(5),
    DEFAULT_POLLING_RETRY_DELAY: z.coerce.number().default(400),
  })
  .transform((c) => ({
    defaultPollingMaxRetries: c.DEFAULT_POLLING_MAX_RETRIES,
    defaultPollingRetryDelay: c.DEFAULT_POLLING_RETRY_DELAY,
  }));
export type PollingConfig = z.infer<typeof PollingConfig>;
