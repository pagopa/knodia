import {
  addConsumerKeychainMemberMutation,
  addKnodeApiKeychainMemberMutation,
  getConsumerKeychainKeysQueryKey,
  getConsumerKeychainMembershipQueryKey,
  getConsumerKeychainMembersQueryKey,
  getKnodeApiKeychainKeysQueryKey,
  getKnodeApiKeychainMembershipQueryKey,
  getKnodeApiKeychainMembersQueryKey,
  removeConsumerKeychainKeyMutation,
  removeConsumerKeychainMemberMutation,
  removeKnodeApiKeychainKeyMutation,
  removeKnodeApiKeychainMemberMutation,
  uploadConsumerKeychainKeyMutation,
  uploadKnodeApiKeychainKeyMutation,
} from "@knodia/bff-client/tanstack-query";
import {
  type ConsumerKeychainId,
  type KnodeApiKeychainId,
  unsafeBrandUserId,
  type UserId,
} from "@knodia/common-models/ids";
import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";

import type { SupportedKeychainType } from "../models/commons";

type KeychainId = ConsumerKeychainId | KnodeApiKeychainId;

interface MutateOptions {
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

interface UploadKeyBody {
  encodedPem: string;
  name: { en: string };
}

export function useAddKeychainMember(
  keychainId: KeychainId,
  type: SupportedKeychainType,
) {
  const queryClient = useQueryClient();

  const consumer = useMutation({
    ...addConsumerKeychainMemberMutation({ client }),
    onSuccess: (_data, vars) => {
      invalidateMembersList(queryClient, keychainId, "consumption");
      invalidateMembership(
        queryClient,
        keychainId,
        "consumption",
        unsafeBrandUserId(vars.body.userId),
      );
    },
  });

  const api = useMutation({
    ...addKnodeApiKeychainMemberMutation({ client }),
    onSuccess: (_data, vars) => {
      invalidateMembersList(queryClient, keychainId, "api");
      invalidateMembership(
        queryClient,
        keychainId,
        "api",
        unsafeBrandUserId(vars.body.userId),
      );
    },
  });

  const active = match(type)
    .with("consumption", () => consumer)
    .with("api", () => api)
    .exhaustive();

  return {
    isError: active.isError,
    isPending: active.isPending,
    mutate: (userId: UserId, options?: MutateOptions) =>
      match(type)
        .with("consumption", () =>
          consumer.mutate(
            { body: { userId }, path: { consumerKeychainId: keychainId } },
            options,
          ),
        )
        .with("api", () =>
          api.mutate(
            { body: { userId }, path: { knodeApiKeychainId: keychainId } },
            options,
          ),
        )
        .exhaustive(),
  };
}

export function useRemoveKeychainKey(
  keychainId: KeychainId,
  type: SupportedKeychainType,
) {
  const queryClient = useQueryClient();

  const consumer = useMutation({
    ...removeConsumerKeychainKeyMutation({ client }),
    onSuccess: () => invalidateKeysList(queryClient, keychainId, "consumption"),
  });

  const api = useMutation({
    ...removeKnodeApiKeychainKeyMutation({ client }),
    onSuccess: () => invalidateKeysList(queryClient, keychainId, "api"),
  });

  const active = match(type)
    .with("consumption", () => consumer)
    .with("api", () => api)
    .exhaustive();

  return {
    isError: active.isError,
    isPending: active.isPending,
    mutate: (keyId: string, options?: MutateOptions) =>
      match(type)
        .with("consumption", () =>
          consumer.mutate(
            { path: { consumerKeychainId: keychainId, keyId } },
            options,
          ),
        )
        .with("api", () =>
          api.mutate(
            { path: { keyId, knodeApiKeychainId: keychainId } },
            options,
          ),
        )
        .exhaustive(),
  };
}

export function useRemoveKeychainMember(
  keychainId: KeychainId,
  type: SupportedKeychainType,
) {
  const queryClient = useQueryClient();

  const consumer = useMutation({
    ...removeConsumerKeychainMemberMutation({ client }),
    onSuccess: (_data, vars) => {
      invalidateMembersList(queryClient, keychainId, "consumption");
      invalidateMembership(
        queryClient,
        keychainId,
        "consumption",
        unsafeBrandUserId(vars.path.userId),
      );
    },
  });

  const api = useMutation({
    ...removeKnodeApiKeychainMemberMutation({ client }),
    onSuccess: (_data, vars) => {
      invalidateMembersList(queryClient, keychainId, "api");
      invalidateMembership(
        queryClient,
        keychainId,
        "api",
        unsafeBrandUserId(vars.path.userId),
      );
    },
  });

  const active = match(type)
    .with("consumption", () => consumer)
    .with("api", () => api)
    .exhaustive();

  return {
    isError: active.isError,
    isPending: active.isPending,
    mutate: (userId: UserId, options?: MutateOptions) =>
      match(type)
        .with("consumption", () =>
          consumer.mutate(
            { path: { consumerKeychainId: keychainId, userId } },
            options,
          ),
        )
        .with("api", () =>
          api.mutate(
            { path: { knodeApiKeychainId: keychainId, userId } },
            options,
          ),
        )
        .exhaustive(),
  };
}

export function useUploadKeychainKey(
  keychainId: KeychainId,
  type: SupportedKeychainType,
) {
  const queryClient = useQueryClient();

  const consumer = useMutation({
    ...uploadConsumerKeychainKeyMutation({ client }),
    onSuccess: () => invalidateKeysList(queryClient, keychainId, "consumption"),
  });

  const api = useMutation({
    ...uploadKnodeApiKeychainKeyMutation({ client }),
    onSuccess: () => invalidateKeysList(queryClient, keychainId, "api"),
  });

  const active = match(type)
    .with("consumption", () => consumer)
    .with("api", () => api)
    .exhaustive();

  return {
    isError: active.isError,
    isPending: active.isPending,
    mutate: (body: UploadKeyBody, options?: MutateOptions) =>
      match(type)
        .with("consumption", () =>
          consumer.mutate(
            { body, path: { consumerKeychainId: keychainId } },
            options,
          ),
        )
        .with("api", () =>
          api.mutate(
            { body, path: { knodeApiKeychainId: keychainId } },
            options,
          ),
        )
        .exhaustive(),
  };
}

function invalidateKeysList(
  queryClient: QueryClient,
  keychainId: KeychainId,
  type: SupportedKeychainType,
) {
  match(type)
    .with("consumption", () =>
      queryClient.invalidateQueries({
        queryKey: getConsumerKeychainKeysQueryKey({
          client,
          path: { consumerKeychainId: keychainId },
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          query: undefined!,
        }),
      }),
    )
    .with("api", () =>
      queryClient.invalidateQueries({
        queryKey: getKnodeApiKeychainKeysQueryKey({
          client,
          path: { knodeApiKeychainId: keychainId },
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          query: undefined!,
        }),
      }),
    )
    .exhaustive();
}

function invalidateMembership(
  queryClient: QueryClient,
  keychainId: KeychainId,
  type: SupportedKeychainType,
  userId: UserId,
) {
  match(type)
    .with("consumption", () =>
      queryClient.invalidateQueries({
        queryKey: getConsumerKeychainMembershipQueryKey({
          client,
          path: { consumerKeychainId: keychainId, userId },
        }),
      }),
    )
    .with("api", () =>
      queryClient.invalidateQueries({
        queryKey: getKnodeApiKeychainMembershipQueryKey({
          client,
          path: { knodeApiKeychainId: keychainId, userId },
        }),
      }),
    )
    .exhaustive();
}

function invalidateMembersList(
  queryClient: QueryClient,
  keychainId: KeychainId,
  type: SupportedKeychainType,
) {
  match(type)
    .with("consumption", () =>
      queryClient.invalidateQueries({
        queryKey: getConsumerKeychainMembersQueryKey({
          client,
          path: { consumerKeychainId: keychainId },
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          query: undefined!,
        }),
      }),
    )
    .with("api", () =>
      queryClient.invalidateQueries({
        queryKey: getKnodeApiKeychainMembersQueryKey({
          client,
          path: { knodeApiKeychainId: keychainId },
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          query: undefined!,
        }),
      }),
    )
    .exhaustive();
}
