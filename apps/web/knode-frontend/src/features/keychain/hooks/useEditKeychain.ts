import { bffApi } from "@knodia/bff-client";
import {
  getConsumerKeychainDetailsQueryKey,
  getKnodeApiKeychainDetailsQueryKey,
} from "@knodia/bff-client/tanstack-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";

import type { SupportedKeychain } from "../models/commons";

import {
  consumerKeychainsQueryKey,
  knodeApiKeychainsQueryKey,
} from "../services/queries";

export function useEditKeychain(keychain: SupportedKeychain) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      body: bffApi.ConsumerKeychainPatch | bffApi.KnodeApiKeychainPatch,
    ) =>
      match(keychain)
        .with({ type: "consumption" }, ({ keychainId }) =>
          bffApi.updateConsumerKeychain({
            body,
            client,
            path: { consumerKeychainId: keychainId },
          }),
        )
        .with({ type: "api" }, ({ keychainId }) =>
          bffApi.updateKnodeApiKeychain({
            body,
            client,
            path: { knodeApiKeychainId: keychainId },
          }),
        )
        .exhaustive(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: match(keychain)
          .with({ type: "consumption" }, ({ keychainId }) =>
            getConsumerKeychainDetailsQueryKey({
              client,
              path: { consumerKeychainId: keychainId },
            }),
          )
          .with({ type: "api" }, ({ keychainId }) =>
            getKnodeApiKeychainDetailsQueryKey({
              client,
              path: { knodeApiKeychainId: keychainId },
            }),
          )
          .exhaustive(),
      });
      queryClient.invalidateQueries({
        queryKey: match(keychain)
          .with({ type: "consumption" }, () => consumerKeychainsQueryKey())
          .with({ type: "api" }, () => knodeApiKeychainsQueryKey())
          .exhaustive(),
      });
    },
  });
}
