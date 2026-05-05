import type {
  AgreementId,
  EserviceId,
  KnodeId,
} from "@knodia/common-models/ids";

import {
  archiveAgreementByConsumerMutation,
  getConsumerAgreementsQueryKey,
} from "@knodia/bff-client/tanstack-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { consumerEserviceDetailsQuery } from "@/features/e-service/services/queries";
import { client } from "@/libs/axios";

interface UseArchiveAgreementByConsumerParams {
  agreementId: AgreementId;
  eserviceId: EserviceId;
  knodeId: KnodeId;
}

export function useArchiveAgreementByConsumer({
  agreementId,
  eserviceId,
  knodeId,
}: UseArchiveAgreementByConsumerParams) {
  const queryClient = useQueryClient();

  const { isError, isPending, mutate } = useMutation({
    ...archiveAgreementByConsumerMutation({ client }),
    onSuccess: () => {
      queryClient.invalidateQueries(
        consumerEserviceDetailsQuery(eserviceId, knodeId),
      );
      queryClient.invalidateQueries({
        queryKey: getConsumerAgreementsQueryKey({ client }),
      });
    },
  });

  const archiveAgreement = () => {
    mutate({ path: { agreementId }, query: { knodeId } });
  };

  return { archiveAgreement, isError, isPending };
}
