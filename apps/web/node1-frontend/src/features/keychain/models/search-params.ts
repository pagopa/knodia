import { z } from "zod";

export const keychainSearchDefaultValues = {
  offset: 0,
  q: "",
  showOnlyMyKeychains: false,
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
  type: z
    .enum(["consumer", "producer", "api", "all"])
    .default(keychainSearchDefaultValues.type)
    .catch(keychainSearchDefaultValues.type),
});

export type KeychainSearchParams = z.infer<typeof keychainSearchSchema>;
