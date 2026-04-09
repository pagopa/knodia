import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import { createConsumerPurposeMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { consumerEserviceDetailsQuery } from "@/features/e-service/services/queries";
import { client } from "@/libs/axios";

import { usePurposeWizardContext } from "../contexts/usePurposeFormContext";

interface CreatePurposeInput {
  formAnswersJson: Record<string, unknown>;
}

export function useCreatePurpose(eserviceId: EserviceId, knodeId: KnodeId) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, formSchemaVersion } = usePurposeWizardContext();

  const { isError, isPending, mutate } = useMutation({
    ...createConsumerPurposeMutation({ client }),
    onSuccess: async () => {
      await queryClient.refetchQueries(
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

  const createPurpose = ({ formAnswersJson }: CreatePurposeInput) => {
    mutate({
      body: {
        dailyCalls: data.dailyCalls,
        description: { en: data.description },
        eserviceId,
        formAnswersJson,
        formSchemaVersion,
        knodeId,
        name: { en: data.name },
      },
    });
  };

  return { createPurpose, isError, isPending };
}
