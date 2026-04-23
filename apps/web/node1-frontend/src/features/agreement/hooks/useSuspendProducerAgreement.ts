import type { AgreementId } from "@knodia/common-models/ids";

import { suspendProducerAgreementMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/libs/axios";

import { producerAgreementDetailsQuery } from "../services/queries";

export function useSuspendProducerAgreement(agreementId: AgreementId) {
  const queryClient = useQueryClient();

  const { isError, isPending, mutate } = useMutation({
    ...suspendProducerAgreementMutation({ client }),
    onSuccess: () => {
      queryClient.invalidateQueries(producerAgreementDetailsQuery(agreementId));
    },
  });

  const suspendAgreement = () => {
    mutate({ path: { agreementId } });
  };

  return { isError, isPending, suspendAgreement };
}
