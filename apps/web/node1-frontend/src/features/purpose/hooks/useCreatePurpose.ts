import type { bffApi } from "@knodia/bff-client";

import { createConsumerPurposeMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import type { PurposeFormDraftData } from "@/features/purpose/types/purposeCreateForm";

import { client } from "@/libs/axios";

export function useCreatePurpose(eserviceId: string, knodeId: bffApi.KnodeId) {
  const navigate = useNavigate();

  const { isError, isPending, mutate } = useMutation({
    ...createConsumerPurposeMutation({ client }),
    onSuccess: () => {
      navigate({
        params: { id: eserviceId },
        search: { knodeId },
        to: "/consumption/e-services/$id",
      });
    },
  });

  const createPurpose = (data: PurposeFormDraftData) => {
    mutate({
      body: {
        dailyCalls: data.dailyCalls,
        description: { en: data.description },
        eserviceId,
        formAnswersJson: {},
        knodeId,
        name: { en: data.name },
      },
    });
  };

  return { createPurpose, isError, isPending };
}
