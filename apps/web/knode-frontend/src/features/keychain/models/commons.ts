import z from "zod";

export const keychainType = z.enum(["production", "consumption", "api"]);
export type KeychainType = z.infer<typeof keychainType>;

export const consumerKeychainDetailsTab = z.enum([
  "members",
  "public-keys",
  "purposes",
]);
export type ConsumerKeychainDetailsTab = z.infer<
  typeof consumerKeychainDetailsTab
>;
