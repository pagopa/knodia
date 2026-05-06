import type { KnodeId, PurposeId } from "@knodia/common-models/ids";

import { archivePurposeByConsumerMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/libs/axios";

import {
  consumerPurposeDetailsQuery,
  consumerPurposesQueryKey,
} from "../services/queries";

export function useArchivePurposeByConsumer(
  purposeId: PurposeId,
  knodeId: KnodeId,
) {
  const queryClient = useQueryClient();

  const { isError, isPending, mutate } = useMutation({
    ...archivePurposeByConsumerMutation({ client }),
    onSuccess: () => {
      queryClient.invalidateQueries(
        consumerPurposeDetailsQuery(purposeId, knodeId),
      );
      queryClient.invalidateQueries({
        queryKey: consumerPurposesQueryKey(),
      });
    },
  });

  const archivePurpose = () => {
    mutate({ path: { purposeId }, query: { knodeId } });
  };

  return { archivePurpose, isError, isPending };
}
