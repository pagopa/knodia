import { z } from "zod";

import { keychainType, type KeychainType } from "./commons";

export const keychainSearchDefaultValues = {
  offset: 0,
  type: "consumer" satisfies KeychainType,
} as const;

export const keychainSearchSchema = z.object({
  offset: z
    .number()
    .min(0)
    .default(keychainSearchDefaultValues.offset)
    .catch(keychainSearchDefaultValues.offset),
  type: keychainType
    .default(keychainSearchDefaultValues.type)
    .catch(keychainSearchDefaultValues.type),
});

export type KeychainSearchParams = z.infer<typeof keychainSearchSchema>;
