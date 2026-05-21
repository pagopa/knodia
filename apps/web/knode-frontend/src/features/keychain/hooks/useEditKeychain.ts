import { bffApi } from "@knodia/bff-client";
import {
  getConsumerKeychainDetailsQueryKey,
  getKnodeApiKeychainDetailsQueryKey,
} from "@knodia/bff-client/tanstack-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";

import type { KeychainType } from "../models/commons";

import {
  consumerKeychainsQueryKey,
  knodeApiKeychainsQueryKey,
} from "../services/queries";

interface UseEditKeychainParams {
  keychainId: string;
  onSuccess?: () => void;
  type: KeychainType;
}

export function useEditKeychain({
  keychainId,
  onSuccess: onSuccessCallback,
  type,
}: UseEditKeychainParams) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      body: bffApi.ConsumerKeychainPatch | bffApi.KnodeApiKeychainPatch,
    ) =>
      match(type)
        .with("consumption", () =>
          bffApi.updateConsumerKeychain({
            body,
            client,
            path: { consumerKeychainId: keychainId },
          }),
        )
        .with("api", () =>
          bffApi.updateKnodeApiKeychain({
            body,
            client,
            path: { knodeApiKeychainId: keychainId },
          }),
        )
        .with("production", () => {
          throw new Error("Producer keychains are not supported yet.");
        })
        .exhaustive(),
    onSuccess: () => {
      match(type)
        .with("consumption", () => {
          queryClient.invalidateQueries({
            queryKey: getConsumerKeychainDetailsQueryKey({
              client,
              path: { consumerKeychainId: keychainId },
            }),
          });
          queryClient.invalidateQueries({
            queryKey: consumerKeychainsQueryKey(),
          });
        })
        .with("api", () => {
          queryClient.invalidateQueries({
            queryKey: getKnodeApiKeychainDetailsQueryKey({
              client,
              path: { knodeApiKeychainId: keychainId },
            }),
          });
          queryClient.invalidateQueries({
            queryKey: knodeApiKeychainsQueryKey(),
          });
        })
        .with("production", () => {
          throw new Error("Producer keychains are not supported yet.");
        })
        .exhaustive();
      onSuccessCallback?.();
    },
  });
}
