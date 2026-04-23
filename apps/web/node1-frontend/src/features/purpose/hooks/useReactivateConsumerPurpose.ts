import type { KnodeId, PurposeId } from "@knodia/common-models/ids";

import { reactivatePurposeByConsumerMutation } from "@knodia/bff-client/tanstack-query";
import { toastQueue } from "@knodia/ui-kit/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/libs/axios";

import { consumerPurposeDetailsQuery } from "../services/queries";

export function useReactivateConsumerPurpose(
  purposeId: PurposeId,
  knodeId: KnodeId,
) {
  const queryClient = useQueryClient();

  const { isPending, mutate } = useMutation({
    ...reactivatePurposeByConsumerMutation({ client }),
    onError: () =>
      toastQueue.add({
        description: "Please try again later.",
        kind: "error",
        title: "Unable to reactivate Purpose",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(
        consumerPurposeDetailsQuery(purposeId, knodeId),
      );
    },
  });

  const reactivatePurpose = () => {
    mutate({ path: { purposeId }, query: { knodeId } });
  };

  return { isPending, reactivatePurpose };
}
