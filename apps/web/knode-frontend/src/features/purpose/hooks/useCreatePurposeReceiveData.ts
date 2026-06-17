import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import { createConsumerPurposeMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { client } from "@/libs/axios";

import { useReceiveDataPurposeWizardContext } from "../contexts/useReceiveDataPurposeFormContext";
import { consumerPurposesByEserviceQuery } from "../services/queries";

export function useCreatePurposeReceiveData(
  eserviceId: EserviceId,
  knodeId: KnodeId,
) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, selectedPurposeFormOptionId } =
    useReceiveDataPurposeWizardContext();

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

  const createPurpose = () => {
    if (!selectedPurposeFormOptionId) return;
    mutate({
      body: {
        dailyCalls: data.dailyCalls,
        description: { en: data.description },
        eserviceId,
        eserviceMode: "ReceiveData",
        knodeId,
        name: { en: data.name },
        purposeFormOptionId: selectedPurposeFormOptionId,
      },
    });
  };

  return { createPurpose, isError, isPending };
}
