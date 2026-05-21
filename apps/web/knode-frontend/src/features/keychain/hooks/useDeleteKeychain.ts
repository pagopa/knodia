import { bffApi } from "@knodia/bff-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";

import type { KeychainType } from "../models/commons";

import {
  consumerKeychainsQueryKey,
  knodeApiKeychainsQueryKey,
} from "../services/queries";

interface UseDeleteKeychainParams {
  keychainId: string;
  type: KeychainType;
}

export function useDeleteKeychain({
  keychainId,
  type,
}: UseDeleteKeychainParams) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      match(type)
        .with("consumption", () =>
          bffApi.deleteConsumerKeychain({
            client,
            path: { consumerKeychainId: keychainId },
          }),
        )
        .with("api", () =>
          bffApi.deleteKnodeApiKeychain({
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
            queryKey: consumerKeychainsQueryKey(),
          });
          navigate({
            search: { offset: 0, type: "consumption" },
            to: "/keychains",
          });
        })
        .with("api", () => {
          queryClient.invalidateQueries({
            queryKey: knodeApiKeychainsQueryKey(),
          });
          navigate({ search: { offset: 0, type: "api" }, to: "/keychains" });
        })
        .with("production", () => {
          throw new Error("Producer keychains are not supported yet.");
        })
        .exhaustive();
    },
  });
}
