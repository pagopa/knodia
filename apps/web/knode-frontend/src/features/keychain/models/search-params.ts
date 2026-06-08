import { z } from "zod";

import {
  consumerKeychainDetailsTab,
  type ConsumerKeychainDetailsTab,
  keychainType,
  type KeychainType,
  knodeApiKeychainDetailsTab,
  type KnodeApiKeychainDetailsTab,
  producerKeychainDetailsTab,
  type ProducerKeychainDetailsTab,
} from "./commons";

export const keychainSearchDefaultValues = {
  offset: 0,
  type: "consumption" satisfies KeychainType,
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

export const producerKeychainDetailsSearchDefaultValues = {
  offset: 0,
  tab: "public-keys" satisfies ProducerKeychainDetailsTab,
} as const;

export const producerKeychainDetailsSearchSchema = z.object({
  offset: z
    .number()
    .min(0)
    .default(producerKeychainDetailsSearchDefaultValues.offset)
    .catch(producerKeychainDetailsSearchDefaultValues.offset),
  tab: producerKeychainDetailsTab
    .default(producerKeychainDetailsSearchDefaultValues.tab)
    .catch(producerKeychainDetailsSearchDefaultValues.tab),
});
