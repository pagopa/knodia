import { z } from "zod";

export const keychainSearchDefaultValues = {
  offset: 0,
  q: "",
  showOnlyMyKeychains: false,
  sortBy: "name",
  sortDirection: "descending",
  type: "all",
} as const;

export const keychainSearchSchema = z.object({
  offset: z
    .number()
    .min(0)
    .default(keychainSearchDefaultValues.offset)
    .catch(keychainSearchDefaultValues.offset),
  q: z
    .string()
    .default(keychainSearchDefaultValues.q)
    .catch(keychainSearchDefaultValues.q),
  showOnlyMyKeychains: z
    .boolean()
    .default(keychainSearchDefaultValues.showOnlyMyKeychains)
    .catch(keychainSearchDefaultValues.showOnlyMyKeychains),
  sortBy: z
    .enum(["name", "type", "numKeys"])
    .default(keychainSearchDefaultValues.sortBy)
    .catch(keychainSearchDefaultValues.sortBy),
  sortDirection: z
    .enum(["ascending", "descending"])
    .default(keychainSearchDefaultValues.sortDirection)
    .catch(keychainSearchDefaultValues.sortDirection),
  type: z
    .enum(["consumer", "producer", "api", "all"])
    .default(keychainSearchDefaultValues.type)
    .catch(keychainSearchDefaultValues.type),
});

export type KeychainSearchParams = z.infer<typeof keychainSearchSchema>;
