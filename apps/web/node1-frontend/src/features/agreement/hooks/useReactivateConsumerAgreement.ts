import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import { reactivateConsumerAgreementMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { consumerEserviceDetailsQuery } from "@/features/e-service/services/queries";
import { client } from "@/libs/axios";

interface UseReactivateConsumerAgreementParams {
  agreementId: string;
  eserviceId: EserviceId;
  knodeId: KnodeId;
}

export function useReactivateConsumerAgreement({
  agreementId,
  eserviceId,
  knodeId,
}: UseReactivateConsumerAgreementParams) {
  const queryClient = useQueryClient();

  const { isError, isPending, mutate } = useMutation({
    ...reactivateConsumerAgreementMutation({ client }),
    onSuccess: () => {
      queryClient.invalidateQueries(
        consumerEserviceDetailsQuery(eserviceId, knodeId),
      );
    },
  });

  const reactivateAgreement = () => {
    mutate({ path: { agreementId }, query: { knodeId } });
  };

  return { isError, isPending, reactivateAgreement };
}
