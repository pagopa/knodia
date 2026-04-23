import type {
  AgreementId,
  EserviceId,
  KnodeId,
} from "@knodia/common-models/ids";

import { suspendConsumerAgreementMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { consumerEserviceDetailsQuery } from "@/features/e-service/services/queries";
import { client } from "@/libs/axios";

interface UseSuspendConsumerAgreementParams {
  agreementId: AgreementId;
  eserviceId: EserviceId;
  knodeId: KnodeId;
}

export function useSuspendConsumerAgreement({
  agreementId,
  eserviceId,
  knodeId,
}: UseSuspendConsumerAgreementParams) {
  const queryClient = useQueryClient();

  const { isError, isPending, mutate } = useMutation({
    ...suspendConsumerAgreementMutation({ client }),
    onSuccess: () => {
      queryClient.invalidateQueries(
        consumerEserviceDetailsQuery(eserviceId, knodeId),
      );
    },
  });

  const suspendAgreement = () => {
    mutate({ path: { agreementId }, query: { knodeId } });
  };

  return { isError, isPending, suspendAgreement };
}
