import { bffApi } from "@knodia/bff-client";
import { type UserId } from "@knodia/common-models/ids";
import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";

import type { KeychainWithKeyMemberOps } from "../models/commons";

import {
  consumerKeychainKeysQueryKey,
  consumerKeychainMembershipQueryKey,
  consumerKeychainMembersQueryKey,
  consumerKeychainsQueryKey,
  knodeApiKeychainKeysQueryKey,
  knodeApiKeychainMembershipQueryKey,
  knodeApiKeychainMembersQueryKey,
  knodeApiKeychainsQueryKey,
} from "../services/queries";

interface UploadKeyBody {
  encodedPem: string;
  name: { en: string };
}

export function useAddKeychainMember(keychain: KeychainWithKeyMemberOps) {
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
        .exhaustive(),
    onSuccess: (_data, userId) => {
      invalidateMembersList(queryClient, keychain);
      invalidateMembership(queryClient, keychain, userId);
      invalidateKeychainsList(queryClient, keychain);
    },
  });
}

export function useRemoveKeychainKey(keychain: KeychainWithKeyMemberOps) {
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

export function useRemoveKeychainMember(keychain: KeychainWithKeyMemberOps) {
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
        .exhaustive(),
    onSuccess: (_data, userId) => {
      invalidateMembersList(queryClient, keychain);
      invalidateMembership(queryClient, keychain, userId);
      invalidateKeychainsList(queryClient, keychain);
    },
  });
}

export function useUploadKeychainKey(keychain: KeychainWithKeyMemberOps) {
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
  keychain: KeychainWithKeyMemberOps,
) {
  queryClient.invalidateQueries({
    queryKey: match(keychain)
      .with({ type: "consumption" }, () => consumerKeychainsQueryKey())
      .with({ type: "api" }, () => knodeApiKeychainsQueryKey())
      .exhaustive(),
  });
}

function invalidateKeysList(
  queryClient: QueryClient,
  keychain: KeychainWithKeyMemberOps,
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
  keychain: KeychainWithKeyMemberOps,
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
      .exhaustive(),
  });
}

function invalidateMembersList(
  queryClient: QueryClient,
  keychain: KeychainWithKeyMemberOps,
) {
  queryClient.invalidateQueries({
    queryKey: match(keychain)
      .with({ type: "consumption" }, ({ keychainId }) =>
        consumerKeychainMembersQueryKey(keychainId),
      )
      .with({ type: "api" }, ({ keychainId }) =>
        knodeApiKeychainMembersQueryKey(keychainId),
      )
      .exhaustive(),
  });
}
