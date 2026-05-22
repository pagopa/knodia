import { z } from "zod";

import {
  consumerKeychainDetailsTab,
  type ConsumerKeychainDetailsTab,
  keychainType,
  knodeApiKeychainDetailsTab,
  type KnodeApiKeychainDetailsTab,
} from "./commons";

export const supportedKeychainTab = keychainType.exclude(["production"]);
type SupportedKeychainTab = z.infer<typeof supportedKeychainTab>;

export const keychainSearchDefaultValues = {
  offset: 0,
  type: "consumption" satisfies SupportedKeychainTab,
} as const;

export const keychainSearchSchema = z.object({
  offset: z
    .number()
    .min(0)
    .default(keychainSearchDefaultValues.offset)
    .catch(keychainSearchDefaultValues.offset),
  type: supportedKeychainTab
    .default(keychainSearchDefaultValues.type)
    .catch(keychainSearchDefaultValues.type),
});

export const consumerKeychainDetailsSearchDefaultValues = {
  offset: 0,
  tab: "public-keys" satisfies ConsumerKeychainDetailsTab,
} as const;

export const consumerKeychainDetailsSearchSchema = z.object({
  offset: z
    .number()
    .min(0)
    .default(consumerKeychainDetailsSearchDefaultValues.offset)
    .catch(consumerKeychainDetailsSearchDefaultValues.offset),
  tab: consumerKeychainDetailsTab
    .default(consumerKeychainDetailsSearchDefaultValues.tab)
    .catch(consumerKeychainDetailsSearchDefaultValues.tab),
});

export const knodeApiKeychainDetailsSearchDefaultValues = {
  offset: 0,
  tab: "public-keys" satisfies KnodeApiKeychainDetailsTab,
} as const;

export const knodeApiKeychainDetailsSearchSchema = z.object({
  offset: z
    .number()
    .min(0)
    .default(knodeApiKeychainDetailsSearchDefaultValues.offset)
    .catch(knodeApiKeychainDetailsSearchDefaultValues.offset),
  tab: knodeApiKeychainDetailsTab
    .default(knodeApiKeychainDetailsSearchDefaultValues.tab)
    .catch(knodeApiKeychainDetailsSearchDefaultValues.tab),
});
