import { z } from "zod";

import {
  consumerKeychainDetailsTab,
  type ConsumerKeychainDetailsTab,
  keychainType,
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
