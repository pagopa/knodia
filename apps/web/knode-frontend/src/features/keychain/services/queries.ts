import {
  getConsumerKeychainDetailsOptions,
  getConsumerKeychainsOptions,
  getKnodeApiKeychainDetailsOptions,
  getKnodeApiKeychainsOptions,
} from "@knodia/bff-client/tanstack-query";

import { client } from "@/libs/axios";

const KEYCHAINS_PAGE_LIMIT = 10;

export const consumerKeychainsQuery = (offset: number) =>
  getConsumerKeychainsOptions({
    client,
    query: { limit: KEYCHAINS_PAGE_LIMIT, offset },
  });

export const knodeApiKeychainsQuery = (offset: number) =>
  getKnodeApiKeychainsOptions({
    client,
    query: { limit: KEYCHAINS_PAGE_LIMIT, offset },
  });

export const consumerKeychainDetailsQuery = (consumerKeychainId: string) =>
  getConsumerKeychainDetailsOptions({
    client,
    path: { consumerKeychainId },
  });

export const knodeApiKeychainDetailsQuery = (knodeApiKeychainId: string) =>
  getKnodeApiKeychainDetailsOptions({
    client,
    path: { knodeApiKeychainId },
  });
