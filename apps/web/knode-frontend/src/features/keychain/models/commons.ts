import type {
  ConsumerKeychainId,
  KnodeApiKeychainId,
  ProducerKeychainId,
} from "@knodia/common-models/ids";

import z from "zod";

export const keychainType = z.enum(["production", "consumption", "api"]);
export type KeychainType = z.infer<typeof keychainType>;

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
