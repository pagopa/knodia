import type {
  ConsumerKeychainId,
  KnodeApiKeychainId,
  UserId,
} from "@knodia/common-models/ids";

import {
  getConsumerKeychainDetailsOptions,
  getConsumerKeychainKeysQueryKey,
  getConsumerKeychainMembershipQueryKey,
  getConsumerKeychainMembersQueryKey,
  getConsumerKeychainsOptions,
  getConsumerKeychainsQueryKey,
  getKnodeApiKeychainDetailsOptions,
  getKnodeApiKeychainKeysQueryKey,
  getKnodeApiKeychainMembershipQueryKey,
  getKnodeApiKeychainMembersQueryKey,
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

export const consumerKeychainKeysQueryKey = (
  consumerKeychainId: ConsumerKeychainId,
) =>
  getConsumerKeychainKeysQueryKey({
    client,
    path: { consumerKeychainId },
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    query: undefined!,
  });

export const knodeApiKeychainKeysQueryKey = (
  knodeApiKeychainId: KnodeApiKeychainId,
) =>
  getKnodeApiKeychainKeysQueryKey({
    client,
    path: { knodeApiKeychainId },
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    query: undefined!,
  });

export const consumerKeychainMembersQueryKey = (
  consumerKeychainId: ConsumerKeychainId,
) =>
  getConsumerKeychainMembersQueryKey({
    client,
    path: { consumerKeychainId },
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    query: undefined!,
  });

export const knodeApiKeychainMembersQueryKey = (
  knodeApiKeychainId: KnodeApiKeychainId,
) =>
  getKnodeApiKeychainMembersQueryKey({
    client,
    path: { knodeApiKeychainId },
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    query: undefined!,
  });

export const consumerKeychainMembershipQueryKey = (
  consumerKeychainId: ConsumerKeychainId,
  userId: UserId,
) =>
  getConsumerKeychainMembershipQueryKey({
    client,
    path: { consumerKeychainId, userId },
  });

export const knodeApiKeychainMembershipQueryKey = (
  knodeApiKeychainId: KnodeApiKeychainId,
  userId: UserId,
) =>
  getKnodeApiKeychainMembershipQueryKey({
    client,
    path: { knodeApiKeychainId, userId },
  });
