import type { PurposeId } from "@knodia/common-models/ids";

import { suspendProducerPurposeMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/libs/axios";

import { producerPurposeDetailsQuery } from "../services/queries";

export function useSuspendProducerPurpose(purposeId: PurposeId) {
  const queryClient = useQueryClient();

  const { isError, isPending, mutate } = useMutation({
    ...suspendProducerPurposeMutation({ client }),
    onSuccess: () => {
      queryClient.invalidateQueries(producerPurposeDetailsQuery(purposeId));
    },
  });

  const suspendPurpose = () => {
    mutate({ path: { purposeId } });
  };

  return { isError, isPending, suspendPurpose };
}
