import type { KnodeId } from "@knodia/common-models/ids";

import { useCallback, useMemo, useState } from "react";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";
import type { DetailsStepData } from "@/features/purpose/types/purposeCreateForm";

import {
  PURPOSE_FORM_DEFAULTS,
  type PurposeFormDraftData,
} from "@/features/purpose/types/purposeCreateForm";

import {
  PurposeWizardContext,
  type PurposeWizardContextValue,
} from "./usePurposeFormContext";

interface Props {
  children: React.ReactNode;
  eservice: ConsumptionEserviceDetail;
  knodeId: KnodeId;
}

export function PurposeFormProvider({ children, eservice, knodeId }: Props) {
  const [data, setData] = useState<PurposeFormDraftData>(PURPOSE_FORM_DEFAULTS);

  const updateDetailsStep = useCallback((stepData: DetailsStepData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const value = useMemo<PurposeWizardContextValue>(
    () => ({
      data,
      eserviceId: eservice.id,
      eserviceName: eservice.name,
      knodeId,
      maxDailyCallsPerConsumer: eservice.maxDailyCalls.perConsumer,
      updateDetailsStep,
    }),
    [data, eservice, knodeId, updateDetailsStep],
  );

  return (
    <PurposeWizardContext.Provider value={value}>
      {children}
    </PurposeWizardContext.Provider>
  );
}
