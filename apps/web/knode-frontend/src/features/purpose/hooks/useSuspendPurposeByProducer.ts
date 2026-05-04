import type { PurposeId } from "@knodia/common-models/ids";

import { suspendPurposeByProducerMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/libs/axios";

import { producerPurposeDetailsQuery } from "../services/queries";

export function useSuspendPurposeByProducer(purposeId: PurposeId) {
  const queryClient = useQueryClient();

  const { isError, isPending, mutate } = useMutation({
    ...suspendPurposeByProducerMutation({ client }),
    onSuccess: () => {
      queryClient.invalidateQueries(producerPurposeDetailsQuery(purposeId));
    },
  });

  const suspendPurpose = () => {
    mutate({ path: { purposeId } });
  };

  return { isError, isPending, suspendPurpose };
}
