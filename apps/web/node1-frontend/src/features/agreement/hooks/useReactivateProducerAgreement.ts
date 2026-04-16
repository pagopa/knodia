import type { AgreementId } from "@knodia/common-models/ids";

import { reactivateProducerAgreementMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/libs/axios";

import { producerAgreementDetailsQuery } from "../services/queries";

export function useReactivateProducerAgreement(agreementId: AgreementId) {
  const queryClient = useQueryClient();

  const { isError, isPending, mutate } = useMutation({
    ...reactivateProducerAgreementMutation({ client }),
    onSuccess: () => {
      queryClient.invalidateQueries(producerAgreementDetailsQuery(agreementId));
    },
  });

  const reactivateAgreement = () => {
    mutate({ path: { agreementId } });
  };

  return { isError, isPending, reactivateAgreement };
}
