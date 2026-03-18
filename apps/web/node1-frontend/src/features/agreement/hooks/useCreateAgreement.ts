import type {
  EserviceId,
  EserviceVersionId,
  KnodeId,
} from "@knodia/common-models/ids";

import { createConsumerAgreementMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

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

  const { isError, isPending, mutate } = useMutation({
    ...createConsumerAgreementMutation({ client }),
    onSuccess: () =>
      navigate({
        params: { id: eserviceId },
        search: { knodeId },
        to: "/consumption/e-services/$id",
      }),
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
