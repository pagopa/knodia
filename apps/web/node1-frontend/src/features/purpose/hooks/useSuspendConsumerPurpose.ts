import type { KnodeId, PurposeId } from "@knodia/common-models/ids";

import { suspendConsumerPurposeMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/libs/axios";

import { consumerPurposeDetailsQuery } from "../services/queries";

export function useSuspendConsumerPurpose(
  purposeId: PurposeId,
  knodeId: KnodeId,
) {
  const queryClient = useQueryClient();

  const { isError, isPending, mutate } = useMutation({
    ...suspendConsumerPurposeMutation({ client }),
    onSuccess: () => {
      queryClient.invalidateQueries(
        consumerPurposeDetailsQuery(purposeId, knodeId),
      );
    },
  });

  const suspendPurpose = () => {
    mutate({ path: { purposeId }, query: { knodeId } });
  };

  return { isError, isPending, suspendPurpose };
}
