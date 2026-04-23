import type { PurposeId } from "@knodia/common-models/ids";

import { reactivatePurposeByProducerMutation } from "@knodia/bff-client/tanstack-query";
import { toastQueue } from "@knodia/ui-kit/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/libs/axios";

import { producerPurposeDetailsQuery } from "../services/queries";

export function useReactivateProducerPurpose(purposeId: PurposeId) {
  const queryClient = useQueryClient();

  const { isPending, mutate } = useMutation({
    ...reactivatePurposeByProducerMutation({ client }),
    onError: () =>
      toastQueue.add({
        description: "Please try again later.",
        kind: "error",
        title: "Unable to reactivate Purpose",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(producerPurposeDetailsQuery(purposeId));
    },
  });

  const reactivatePurpose = () => {
    mutate({ path: { purposeId } });
  };

  return { isPending, reactivatePurpose };
}
