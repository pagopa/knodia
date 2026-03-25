import type {
  EserviceId,
  EserviceVersionId,
  KnodeId,
} from "@knodia/common-models/ids";

import { createConsumerAgreementMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { consumerEserviceDetailsQuery } from "@/features/e-service/services/queries";
import { client } from "@/libs/axios";

interface UseCreateAgreementParams {
  eserviceId: EserviceId;
  knodeId: KnodeId;
}

export function useCreateAgreement({
  eserviceId,
  knodeId,
}: UseCreateAgreementParams) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { isError, isPending, mutate } = useMutation({
    ...createConsumerAgreementMutation({ client }),
    onSuccess: async () => {
      queryClient.invalidateQueries(
        consumerEserviceDetailsQuery(eserviceId, knodeId),
      );

      navigate({
        params: { id: eserviceId },
        replace: true,
        search: { knodeId },
        to: "/consumption/e-services/$id",
      });
    },
  });

  const createAgreement = (eserviceVersionId: EserviceVersionId) => {
    mutate({
      body: {
        eserviceId,
        eserviceVersionId,
        knodeId,
      },
    });
  };

  return { createAgreement, isError, isPending };
}
