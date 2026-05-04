import type { AgreementId } from "@knodia/common-models/ids";

import { reactivateAgreementByProducerMutation } from "@knodia/bff-client/tanstack-query";
import { toastQueue } from "@knodia/ui-kit/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/libs/axios";

import { producerAgreementDetailsQuery } from "../services/queries";

export function useReactivateAgreementByProducer(agreementId: AgreementId) {
  const queryClient = useQueryClient();

  const { isPending, mutate } = useMutation({
    ...reactivateAgreementByProducerMutation({ client }),
    onError: () =>
      toastQueue.add({
        description: "Please try again later.",
        kind: "error",
        title: "Unable to reactivate Agreement",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(producerAgreementDetailsQuery(agreementId));
    },
  });

  const reactivateAgreement = () => {
    mutate({ path: { agreementId } });
  };

  return { isPending, reactivateAgreement };
}
