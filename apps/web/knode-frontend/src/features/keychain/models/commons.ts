import type {
  ConsumerKeychainId,
  KnodeApiKeychainId,
  ProducerKeychainId,
} from "@knodia/common-models/ids";

import z from "zod";

export const keychainType = z.enum(["production", "consumption", "api"]);
export type KeychainType = z.infer<typeof keychainType>;

// Producer Keychain key/member endpoints are not yet exposed; hooks and
// components that perform these operations accept only Consumer and Knode API
// keychains until the BFF endpoints land (KN-642 for the BFF, KN-673 for the FE
// wiring).
export type KeychainWithKeyMemberOps = Exclude<
  SupportedKeychain,
  { type: "production" }
>;

export type SupportedKeychain =
  | { keychainId: ConsumerKeychainId; type: "consumption" }
  | { keychainId: KnodeApiKeychainId; type: "api" }
  | { keychainId: ProducerKeychainId; type: "production" };

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

export const producerKeychainDetailsTab = z.enum([
  "e-services",
  "members",
  "public-keys",
]);
export type ProducerKeychainDetailsTab = z.infer<
  typeof producerKeychainDetailsTab
>;
