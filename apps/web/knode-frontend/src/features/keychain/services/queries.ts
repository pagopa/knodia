import type {
  ConsumerKeychainId,
  KnodeApiKeychainId,
  ProducerKeychainId,
  UserId,
} from "@knodia/common-models/ids";

import {
  getConsumerKeychainDetailsOptions,
  getConsumerKeychainKeysOptions,
  getConsumerKeychainKeysQueryKey,
  getConsumerKeychainMembershipOptions,
  getConsumerKeychainMembershipQueryKey,
  getConsumerKeychainMembersOptions,
  getConsumerKeychainMembersQueryKey,
  getConsumerKeychainPurposesOptions,
  getConsumerKeychainsOptions,
  getConsumerKeychainsQueryKey,
  getKnodeApiKeychainDetailsOptions,
  getKnodeApiKeychainKeysOptions,
  getKnodeApiKeychainKeysQueryKey,
  getKnodeApiKeychainMembershipOptions,
  getKnodeApiKeychainMembershipQueryKey,
  getKnodeApiKeychainMembersOptions,
  getKnodeApiKeychainMembersQueryKey,
  getKnodeApiKeychainsOptions,
  getKnodeApiKeychainsQueryKey,
  getProducerKeychainDetailsOptions,
  getProducerKeychainEservicesOptions,
  getProducerKeychainKeysOptions,
  getProducerKeychainKeysQueryKey,
  getProducerKeychainMembershipOptions,
  getProducerKeychainMembershipQueryKey,
  getProducerKeychainMembersOptions,
  getProducerKeychainMembersQueryKey,
  getProducerKeychainsOptions,
  getProducerKeychainsQueryKey,
} from "@knodia/bff-client/tanstack-query";

import { client } from "@/libs/axios";

const KEYCHAINS_PAGE_LIMIT = 10;
const KEYS_PAGE_LIMIT = 50;
const MEMBERS_PAGE_LIMIT = 50;
const PURPOSES_PAGE_LIMIT = 10;
const ESERVICES_PAGE_LIMIT = 5;

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

export const producerKeychainsQuery = (offset: number) =>
  getProducerKeychainsOptions({
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

export const producerKeychainDetailsQuery = (
  producerKeychainId: ProducerKeychainId,
) =>
  getProducerKeychainDetailsOptions({
    client,
    path: { producerKeychainId },
  });

export const consumerKeychainKeysQuery = (
  consumerKeychainId: ConsumerKeychainId,
  offset: number,
) =>
  getConsumerKeychainKeysOptions({
    client,
    path: { consumerKeychainId },
    query: { limit: KEYS_PAGE_LIMIT, offset },
  });

export const knodeApiKeychainKeysQuery = (
  knodeApiKeychainId: KnodeApiKeychainId,
  offset: number,
) =>
  getKnodeApiKeychainKeysOptions({
    client,
    path: { knodeApiKeychainId },
    query: { limit: KEYS_PAGE_LIMIT, offset },
  });

export const consumerKeychainMembersQuery = (
  consumerKeychainId: ConsumerKeychainId,
  offset: number,
) =>
  getConsumerKeychainMembersOptions({
    client,
    path: { consumerKeychainId },
    query: { limit: MEMBERS_PAGE_LIMIT, offset },
  });

export const knodeApiKeychainMembersQuery = (
  knodeApiKeychainId: KnodeApiKeychainId,
  offset: number,
) =>
  getKnodeApiKeychainMembersOptions({
    client,
    path: { knodeApiKeychainId },
    query: { limit: MEMBERS_PAGE_LIMIT, offset },
  });

export const consumerKeychainMembershipQuery = (
  consumerKeychainId: ConsumerKeychainId,
  userId: UserId,
) =>
  getConsumerKeychainMembershipOptions({
    client,
    path: { consumerKeychainId, userId },
  });

export const knodeApiKeychainMembershipQuery = (
  knodeApiKeychainId: KnodeApiKeychainId,
  userId: UserId,
) =>
  getKnodeApiKeychainMembershipOptions({
    client,
    path: { knodeApiKeychainId, userId },
  });

export const producerKeychainMembersQuery = (
  producerKeychainId: ProducerKeychainId,
  offset: number,
) =>
  getProducerKeychainMembersOptions({
    client,
    path: { producerKeychainId },
    query: { limit: MEMBERS_PAGE_LIMIT, offset },
  });

export const producerKeychainKeysQuery = (
  producerKeychainId: ProducerKeychainId,
  offset: number,
) =>
  getProducerKeychainKeysOptions({
    client,
    path: { producerKeychainId },
    query: { limit: KEYS_PAGE_LIMIT, offset },
  });

export const producerKeychainMembershipQuery = (
  producerKeychainId: ProducerKeychainId,
  userId: UserId,
) =>
  getProducerKeychainMembershipOptions({
    client,
    path: { producerKeychainId, userId },
  });

export const consumerKeychainPurposesQuery = (
  consumerKeychainId: ConsumerKeychainId,
  offset: number,
) =>
  getConsumerKeychainPurposesOptions({
    client,
    path: { consumerKeychainId },
    query: { limit: PURPOSES_PAGE_LIMIT, offset },
  });

export const producerKeychainEservicesQuery = (
  producerKeychainId: ProducerKeychainId,
  offset: number,
) =>
  getProducerKeychainEservicesOptions({
    client,
    path: { producerKeychainId },
    query: { limit: ESERVICES_PAGE_LIMIT, offset },
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

export const producerKeychainsQueryKey = () =>
  getProducerKeychainsQueryKey({
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

export const producerKeychainMembersQueryKey = (
  producerKeychainId: ProducerKeychainId,
) =>
  getProducerKeychainMembersQueryKey({
    client,
    path: { producerKeychainId },
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    query: undefined!,
  });

export const producerKeychainKeysQueryKey = (
  producerKeychainId: ProducerKeychainId,
) =>
  getProducerKeychainKeysQueryKey({
    client,
    path: { producerKeychainId },
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    query: undefined!,
  });

export const producerKeychainMembershipQueryKey = (
  producerKeychainId: ProducerKeychainId,
  userId: UserId,
) =>
  getProducerKeychainMembershipQueryKey({
    client,
    path: { producerKeychainId, userId },
  });
