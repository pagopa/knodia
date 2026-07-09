import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import { createConsumerPurposeMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { client } from "@/libs/axios";

import { usePurposeWizardContext } from "../contexts/usePurposeFormContext";
import { consumerPurposesByEserviceQuery } from "../services/queries";

interface CreatePurposeInput {
  formAnswersJson: Record<string, unknown>;
}

export function useCreatePurpose(eserviceId: EserviceId, knodeId: KnodeId) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, formSchemaVersion, selectedTemplate } =
    usePurposeWizardContext();

  const { isError, isPending, mutate } = useMutation({
    ...createConsumerPurposeMutation({ client }),
    onSuccess: () => {
      queryClient.invalidateQueries(
        consumerPurposesByEserviceQuery(eserviceId, knodeId),
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
        description: { en: data.description.trim() },
        eserviceId,
        eserviceMode: "ProvideData",
        formAnswersJson,
        formSchemaVersion,
        knodeId,
        name: { en: data.name.trim() },
        ...(selectedTemplate && { template: selectedTemplate }),
      },
    });
  };

  return { createPurpose, isError, isPending };
}
