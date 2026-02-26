import { z } from "zod";

export const keychainSearchDefaultValues = {
  offset: 0,
} as const;

export const keychainSearchSchema = z.object({
  offset: z
    .number()
    .min(0)
    .default(keychainSearchDefaultValues.offset)
    .catch(keychainSearchDefaultValues.offset),
});

export type KeychainSearchParams = z.infer<typeof keychainSearchSchema>;
