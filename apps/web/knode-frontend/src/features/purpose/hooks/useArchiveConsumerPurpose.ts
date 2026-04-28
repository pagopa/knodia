import type { KnodeId, PurposeId } from "@knodia/common-models/ids";

import {
  archivePurposeByConsumerMutation,
  getConsumerPurposesQueryKey,
} from "@knodia/bff-client/tanstack-query";
import { toastQueue } from "@knodia/ui-kit/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/libs/axios";

import { consumerPurposeDetailsQuery } from "../services/queries";

export function useArchiveConsumerPurpose(
  purposeId: PurposeId,
  knodeId: KnodeId,
) {
  const queryClient = useQueryClient();

  const { isError, isPending, mutate } = useMutation({
    ...archivePurposeByConsumerMutation({ client }),
    onError: () =>
      toastQueue.add({
        description: "Please try again later.",
        kind: "error",
        title: "Unable to archive Purpose",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(
        consumerPurposeDetailsQuery(purposeId, knodeId),
      );
      queryClient.invalidateQueries({
        queryKey: getConsumerPurposesQueryKey({
          client,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          query: undefined!,
        }),
      });
    },
  });

  const archivePurpose = () => {
    mutate({ path: { purposeId }, query: { knodeId } });
  };

  return { archivePurpose, isError, isPending };
}
