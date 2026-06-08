import { bffApi } from "@knodia/bff-client";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { match } from "ts-pattern";

import { client } from "@/libs/axios";

import type { KeychainType } from "../models/commons";

export function useCreateKeychain() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({
      body,
      type,
    }: {
      body: bffApi.KeychainSeed;
      type: KeychainType;
    }) =>
      match(type)
        .with("consumption", () =>
          bffApi.createConsumerKeychain({ body, client }),
        )
        .with("production", () =>
          bffApi.createProducerKeychain({ body, client }),
        )
        .with("api", () => bffApi.createKnodeApiKeychain({ body, client }))
        .exhaustive(),
    onSuccess: ({ data: { id } }, { type }) =>
      match(type)
        .with("consumption", () =>
          navigate({ params: { id }, to: "/keychains/consumption/$id" }),
        )
        .with("production", () =>
          navigate({ params: { id }, to: "/keychains/production/$id" }),
        )
        .with("api", () =>
          navigate({ params: { id }, to: "/keychains/api/$id" }),
        )
        .exhaustive(),
  });
}
