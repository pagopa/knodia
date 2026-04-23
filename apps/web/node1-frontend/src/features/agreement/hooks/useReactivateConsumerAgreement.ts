import type {
  AgreementId,
  EserviceId,
  KnodeId,
} from "@knodia/common-models/ids";

import { reactivateConsumerAgreementMutation } from "@knodia/bff-client/tanstack-query";
import { toastQueue } from "@knodia/ui-kit/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { consumerEserviceDetailsQuery } from "@/features/e-service/services/queries";
import { client } from "@/libs/axios";

interface UseReactivateConsumerAgreementParams {
  agreementId: AgreementId;
  eserviceId: EserviceId;
  knodeId: KnodeId;
}

export function useReactivateConsumerAgreement({
  agreementId,
  eserviceId,
  knodeId,
}: UseReactivateConsumerAgreementParams) {
  const queryClient = useQueryClient();

  const { isPending, mutate } = useMutation({
    ...reactivateConsumerAgreementMutation({ client }),
    onError: () =>
      toastQueue.add({
        description: "Please try again later.",
        kind: "error",
        title: "Unable to reactivate Agreement",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(
        consumerEserviceDetailsQuery(eserviceId, knodeId),
      );
    },
  });

  const reactivateAgreement = () => {
    mutate({ path: { agreementId }, query: { knodeId } });
  };

  return { isPending, reactivateAgreement };
}
