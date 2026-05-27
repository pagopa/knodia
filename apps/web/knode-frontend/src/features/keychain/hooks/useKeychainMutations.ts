import { bffApi } from "@knodia/bff-client";
import { type UserId } from "@knodia/common-models/ids";
import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";

import type { KeychainWithKeyOps, SupportedKeychain } from "../models/commons";

import {
  consumerKeychainKeysQueryKey,
  consumerKeychainMembershipQueryKey,
  consumerKeychainMembersQueryKey,
  consumerKeychainsQueryKey,
  knodeApiKeychainKeysQueryKey,
  knodeApiKeychainMembershipQueryKey,
  knodeApiKeychainMembersQueryKey,
  knodeApiKeychainsQueryKey,
  producerKeychainMembershipQueryKey,
  producerKeychainMembersQueryKey,
  producerKeychainsQueryKey,
} from "../services/queries";

interface UploadKeyBody {
  encodedPem: string;
  name: { en: string };
}

export function useAddKeychainMember(keychain: SupportedKeychain) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: UserId) =>
      match(keychain)
        .with({ type: "consumption" }, ({ keychainId }) =>
          bffApi.addConsumerKeychainMember({
            body: { userId },
            client,
            path: { consumerKeychainId: keychainId },
          }),
        )
        .with({ type: "api" }, ({ keychainId }) =>
          bffApi.addKnodeApiKeychainMember({
            body: { userId },
            client,
            path: { knodeApiKeychainId: keychainId },
          }),
        )
        .with({ type: "production" }, ({ keychainId }) =>
          bffApi.addProducerKeychainMember({
            body: { userId },
            client,
            path: { producerKeychainId: keychainId },
          }),
        )
        .exhaustive(),
    onSuccess: (_data, userId) => {
      invalidateMembersList(queryClient, keychain);
      invalidateMembership(queryClient, keychain, userId);
      invalidateKeychainsList(queryClient, keychain);
    },
  });
}

export function useRemoveKeychainKey(keychain: KeychainWithKeyOps) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) =>
      match(keychain)
        .with({ type: "consumption" }, ({ keychainId }) =>
          bffApi.removeConsumerKeychainKey({
            client,
            path: { consumerKeychainId: keychainId, keyId },
          }),
        )
        .with({ type: "api" }, ({ keychainId }) =>
          bffApi.removeKnodeApiKeychainKey({
            client,
            path: { keyId, knodeApiKeychainId: keychainId },
          }),
        )
        .exhaustive(),
    onSuccess: () => {
      invalidateKeysList(queryClient, keychain);
      invalidateKeychainsList(queryClient, keychain);
    },
  });
}

export function useRemoveKeychainMember(keychain: SupportedKeychain) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: UserId) =>
      match(keychain)
        .with({ type: "consumption" }, ({ keychainId }) =>
          bffApi.removeConsumerKeychainMember({
            client,
            path: { consumerKeychainId: keychainId, userId },
          }),
        )
        .with({ type: "api" }, ({ keychainId }) =>
          bffApi.removeKnodeApiKeychainMember({
            client,
            path: { knodeApiKeychainId: keychainId, userId },
          }),
        )
        .with({ type: "production" }, ({ keychainId }) =>
          bffApi.removeProducerKeychainMember({
            client,
            path: { producerKeychainId: keychainId, userId },
          }),
        )
        .exhaustive(),
    onSuccess: (_data, userId) => {
      invalidateMembersList(queryClient, keychain);
      invalidateMembership(queryClient, keychain, userId);
      invalidateKeychainsList(queryClient, keychain);
    },
  });
}

export function useUploadKeychainKey(keychain: KeychainWithKeyOps) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UploadKeyBody) =>
      match(keychain)
        .with({ type: "consumption" }, ({ keychainId }) =>
          bffApi.uploadConsumerKeychainKey({
            body,
            client,
            path: { consumerKeychainId: keychainId },
          }),
        )
        .with({ type: "api" }, ({ keychainId }) =>
          bffApi.uploadKnodeApiKeychainKey({
            body,
            client,
            path: { knodeApiKeychainId: keychainId },
          }),
        )
        .exhaustive(),
    onSuccess: () => {
      invalidateKeysList(queryClient, keychain);
      invalidateKeychainsList(queryClient, keychain);
    },
  });
}

function invalidateKeychainsList(
  queryClient: QueryClient,
  keychain: SupportedKeychain,
) {
  queryClient.invalidateQueries({
    queryKey: match(keychain)
      .with({ type: "consumption" }, () => consumerKeychainsQueryKey())
      .with({ type: "api" }, () => knodeApiKeychainsQueryKey())
      .with({ type: "production" }, () => producerKeychainsQueryKey())
      .exhaustive(),
  });
}

function invalidateKeysList(
  queryClient: QueryClient,
  keychain: KeychainWithKeyOps,
) {
  queryClient.invalidateQueries({
    queryKey: match(keychain)
      .with({ type: "consumption" }, ({ keychainId }) =>
        consumerKeychainKeysQueryKey(keychainId),
      )
      .with({ type: "api" }, ({ keychainId }) =>
        knodeApiKeychainKeysQueryKey(keychainId),
      )
      .exhaustive(),
  });
}

function invalidateMembership(
  queryClient: QueryClient,
  keychain: SupportedKeychain,
  userId: UserId,
) {
  queryClient.invalidateQueries({
    queryKey: match(keychain)
      .with({ type: "consumption" }, ({ keychainId }) =>
        consumerKeychainMembershipQueryKey(keychainId, userId),
      )
      .with({ type: "api" }, ({ keychainId }) =>
        knodeApiKeychainMembershipQueryKey(keychainId, userId),
      )
      .with({ type: "production" }, ({ keychainId }) =>
        producerKeychainMembershipQueryKey(keychainId, userId),
      )
      .exhaustive(),
  });
}

function invalidateMembersList(
  queryClient: QueryClient,
  keychain: SupportedKeychain,
) {
  queryClient.invalidateQueries({
    queryKey: match(keychain)
      .with({ type: "consumption" }, ({ keychainId }) =>
        consumerKeychainMembersQueryKey(keychainId),
      )
      .with({ type: "api" }, ({ keychainId }) =>
        knodeApiKeychainMembersQueryKey(keychainId),
      )
      .with({ type: "production" }, ({ keychainId }) =>
        producerKeychainMembersQueryKey(keychainId),
      )
      .exhaustive(),
  });
}
