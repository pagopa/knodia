import type { bffApi } from "@knodia/bff-client";
import type { KnodeId } from "@knodia/common-models/ids";

import { useCallback, useMemo, useState } from "react";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";

import {
  DETAILS_STEP_DEFAULTS,
  type DetailsStepData,
  type PurposeFormDraftData,
} from "@/features/purpose/types/purposeCreateForm";

import {
  ReceiveDataPurposeWizardContext,
  type ReceiveDataPurposeWizardContextValue,
} from "./useReceiveDataPurposeFormContext";

interface Props {
  children: React.ReactNode;
  eservice: ConsumptionEserviceDetail;
  knodeId: KnodeId;
  onDirty?: () => void;
  purposeFormOptions: bffApi.ConsumerPurposeFormOption[];
}

export function ReceiveDataPurposeFormProvider({
  children,
  eservice,
  knodeId,
  onDirty,
  purposeFormOptions,
}: Props) {
  const [data, setData] = useState<PurposeFormDraftData>(() => ({
    ...DETAILS_STEP_DEFAULTS,
  }));
  const [selectedPurposeFormOptionId, setSelectedPurposeFormOptionId] =
    useState<null | string>(null);

  const updateDetailsStep = useCallback(
    (stepData: DetailsStepData) => {
      setData((prev) => ({ ...prev, ...stepData }));
      onDirty?.();
    },
    [onDirty],
  );

  const selectPurposeFormOption = useCallback(
    (id: string) => {
      setSelectedPurposeFormOptionId(id);
      onDirty?.();
    },
    [onDirty],
  );

  const value = useMemo<ReceiveDataPurposeWizardContextValue>(
    () => ({
      data,
      eservice,
      knodeId,
      purposeFormOptions,
      selectedPurposeFormOptionId,
      selectPurposeFormOption,
      updateDetailsStep,
    }),
    [
      data,
      eservice,
      knodeId,
      purposeFormOptions,
      selectedPurposeFormOptionId,
      selectPurposeFormOption,
      updateDetailsStep,
    ],
  );

  return (
    <ReceiveDataPurposeWizardContext.Provider value={value}>
      {children}
    </ReceiveDataPurposeWizardContext.Provider>
  );
}
