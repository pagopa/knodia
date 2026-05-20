import type {
  ConsumerKeychainId,
  KnodeApiKeychainId,
} from "@knodia/common-models/ids";

import {
  getConsumerKeychainDetailsOptions,
  getConsumerKeychainsOptions,
  getConsumerKeychainsQueryKey,
  getKnodeApiKeychainDetailsOptions,
  getKnodeApiKeychainsOptions,
  getKnodeApiKeychainsQueryKey,
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

export const consumerKeychainDetailsQuery = (
  consumerKeychainId: ConsumerKeychainId,
) =>
  getConsumerKeychainDetailsOptions({
    client,
    path: { consumerKeychainId },
  });

export const knodeApiKeychainDetailsQuery = (
  knodeApiKeychainId: KnodeApiKeychainId,
) =>
  getKnodeApiKeychainDetailsOptions({
    client,
    path: { knodeApiKeychainId },
  });

export const consumerKeychainsQueryKey = () =>
  getConsumerKeychainsQueryKey({
    client,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    query: undefined!,
  });

export const knodeApiKeychainsQueryKey = () =>
  getKnodeApiKeychainsQueryKey({
    client,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    query: undefined!,
  });
