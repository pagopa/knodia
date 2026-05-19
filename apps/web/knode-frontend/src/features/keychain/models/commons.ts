import type {
  ConsumerKeychainId,
  KnodeApiKeychainId,
} from "@knodia/common-models/ids";

import z from "zod";

export const keychainType = z.enum(["production", "consumption", "api"]);
export type KeychainType = z.infer<typeof keychainType>;

export type SupportedKeychainContext =
  | { keychainId: ConsumerKeychainId; type: "consumption" }
  | { keychainId: KnodeApiKeychainId; type: "api" };

export type SupportedKeychainType = Exclude<KeychainType, "production">;

export const consumerKeychainDetailsTab = z.enum([
  "members",
  "public-keys",
  "purposes",
]);
export type ConsumerKeychainDetailsTab = z.infer<
  typeof consumerKeychainDetailsTab
>;

export const knodeApiKeychainDetailsTab = z.enum(["members", "public-keys"]);
export type KnodeApiKeychainDetailsTab = z.infer<
  typeof knodeApiKeychainDetailsTab
>;
