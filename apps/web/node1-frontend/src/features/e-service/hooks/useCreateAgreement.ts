import type { EserviceId, EserviceVersionId } from "@knodia/common-models/ids";

import { bffApi } from "@knodia/bff-client";
import { createConsumerAgreementMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { client } from "@/libs/axios";

interface UseCreateAgreementParams {
  eserviceId: EserviceId;
  knodeId: string;
  onError: () => void;
}

export function useCreateAgreement({
  eserviceId,
  knodeId,
  onError,
}: UseCreateAgreementParams) {
  const navigate = useNavigate();

  const { isPending, mutate } = useMutation({
    ...createConsumerAgreementMutation({ client }),
    onError,
    onSuccess: () => {
      navigate({
        params: { id: eserviceId },
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
        knodeId: knodeId as bffApi.KnodeId,
      },
    });
  };

  return { createAgreement, isPending };
}
