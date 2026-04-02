import type { KnodeId } from "@knodia/common-models/ids";

import { useCallback, useMemo, useState } from "react";

import type { ConsumptionEserviceDetail } from "@/features/e-service/models/consumption-eservice-detail";
import type { FormValues } from "@/features/purpose/engine/types";

import {
  type DetailsStepData,
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
  formSchemaVersion: string;
  knodeId: KnodeId;
}

export function PurposeFormProvider({
  children,
  eservice,
  formSchemaVersion,
  knodeId,
}: Props) {
  const [data, setData] = useState<PurposeFormDraftData>(PURPOSE_FORM_DEFAULTS);
  const [formAnswers, setFormAnswers] = useState<FormValues>({});

  const updateDetailsStep = useCallback((stepData: DetailsStepData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const updateFormAnswers = useCallback((answers: FormValues) => {
    setFormAnswers((prev) => ({ ...prev, ...answers }));
  }, []);

  const value = useMemo<PurposeWizardContextValue>(
    () => ({
      data,
      eserviceId: eservice.id,
      eserviceName: eservice.name,
      formAnswers,
      formSchemaVersion,
      knodeId,
      maxDailyCallsPerConsumer: eservice.maxDailyCalls.perConsumer,
      updateDetailsStep,
      updateFormAnswers,
    }),
    [
      data,
      eservice,
      formAnswers,
      formSchemaVersion,
      knodeId,
      updateDetailsStep,
      updateFormAnswers,
    ],
  );

  return (
    <PurposeWizardContext.Provider value={value}>
      {children}
    </PurposeWizardContext.Provider>
  );
}
