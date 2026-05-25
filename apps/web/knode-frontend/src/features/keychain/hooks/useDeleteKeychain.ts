import { bffApi } from "@knodia/bff-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";

import type { SupportedKeychain } from "../models/commons";

import {
  consumerKeychainsQueryKey,
  knodeApiKeychainsQueryKey,
} from "../services/queries";

export function useDeleteKeychain(keychain: SupportedKeychain) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      match(keychain)
        .with({ type: "consumption" }, ({ keychainId }) =>
          bffApi.deleteConsumerKeychain({
            client,
            path: { consumerKeychainId: keychainId },
          }),
        )
        .with({ type: "api" }, ({ keychainId }) =>
          bffApi.deleteKnodeApiKeychain({
            client,
            path: { knodeApiKeychainId: keychainId },
          }),
        )
        .exhaustive(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: match(keychain)
          .with({ type: "consumption" }, () => consumerKeychainsQueryKey())
          .with({ type: "api" }, () => knodeApiKeychainsQueryKey())
          .exhaustive(),
      });
      navigate({
        search: { offset: 0, type: keychain.type },
        to: "/keychains",
      });
    },
  });
}
