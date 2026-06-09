import type { EserviceId, ProducerKeychainId } from "@knodia/common-models/ids";

import { bffApi } from "@knodia/bff-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { producerKeychainsQueryKey } from "@/features/keychain/services/queries";
import { client } from "@/libs/axios";

export function useLinkKeychainToEservice(eserviceId: EserviceId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (producerKeychainId: ProducerKeychainId) =>
      bffApi.linkEserviceToProducerKeychain({
        body: { eserviceId },
        client,
        path: { producerKeychainId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: producerKeychainsQueryKey() });
    },
  });
}

export function useUnlinkKeychainFromEservice(eserviceId: EserviceId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (producerKeychainId: ProducerKeychainId) =>
      bffApi.unlinkEserviceFromProducerKeychain({
        client,
        path: { eserviceId, producerKeychainId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: producerKeychainsQueryKey() });
    },
  });
}
