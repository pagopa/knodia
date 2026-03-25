import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import { createConsumerPurposeMutation } from "@knodia/bff-client/tanstack-query";
import { PurposeFormSchemaVersion } from "@knodia/purpose-models";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { client } from "@/libs/axios";

import { usePurposeWizardContext } from "../contexts/usePurposeFormContext";

interface CreatePurposeInput {
  formAnswersJson: Record<string, unknown>;
}

export function useCreatePurpose(eserviceId: EserviceId, knodeId: KnodeId) {
  const navigate = useNavigate();
  const { data } = usePurposeWizardContext();

  const { isError, isPending, mutate } = useMutation({
    ...createConsumerPurposeMutation({ client }),
    onSuccess: () => {
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
        formSchemaVersion: PurposeFormSchemaVersion.enum["1.0"],
        knodeId,
        name: { en: data.name },
      },
    });
  };

  return { createPurpose, isError, isPending };
}
