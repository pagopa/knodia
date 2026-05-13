import type { bffApi } from "@knodia/bff-client";
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
  initialTemplate?: bffApi.PurposeTemplateDetails;
  knodeId: KnodeId;
}

export function PurposeFormProvider({
  children,
  eservice,
  formSchemaVersion,
  initialTemplate,
  knodeId,
}: Props) {
  const [data, setData] = useState<PurposeFormDraftData>(() =>
    buildInitialDraft(initialTemplate),
  );
  const [formAnswers, setFormAnswers] = useState<FormValues>(
    () => (initialTemplate?.formAnswersJson ?? {}) as FormValues,
  );

  const updateDetailsStep = useCallback((stepData: DetailsStepData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const updateFormAnswers = useCallback((answers: FormValues) => {
    setFormAnswers((prev) => ({ ...prev, ...answers }));
  }, []);

  const selectedTemplate = useMemo(
    () => (initialTemplate ? { id: initialTemplate.id, knodeId } : undefined),
    [initialTemplate, knodeId],
  );

  const value = useMemo<PurposeWizardContextValue>(
    () => ({
      data,
      eserviceId: eservice.id,
      eserviceName: eservice.name,
      formAnswers,
      formSchemaVersion,
      knodeId,
      maxDailyCallsPerConsumer: eservice.maxDailyCalls.perConsumer,
      selectedTemplate,
      updateDetailsStep,
      updateFormAnswers,
    }),
    [
      data,
      eservice,
      formAnswers,
      formSchemaVersion,
      knodeId,
      selectedTemplate,
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

function buildInitialDraft(
  template: bffApi.PurposeTemplateDetails | undefined,
): PurposeFormDraftData {
  if (!template) return PURPOSE_FORM_DEFAULTS;
  return {
    ...PURPOSE_FORM_DEFAULTS,
    description: template.description.en,
    name: template.name.en,
  };
}
