import {
  createFormHook,
  createFormHookContexts,
  revalidateLogic,
} from "@tanstack/react-form";
import { createContext, useContext } from "react";

import type { DetailsStepData } from "@/features/purpose/types/purposeCreateForm";

import {
  DETAILS_STEP_DEFAULTS,
  detailsStepSchema,
  type PurposeFormDraftData,
} from "@/features/purpose/types/purposeCreateForm";

export interface PurposeWizardContextValue {
  data: PurposeFormDraftData;
  updateDetailsStep: (data: DetailsStepData) => void;
}

export const PurposeWizardContext =
  createContext<null | PurposeWizardContextValue>(null);

const { fieldContext, formContext } = createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldComponents: {},
  fieldContext,
  formComponents: {},
  formContext,
});

export function useDetailsStepForm(
  onSubmitSuccess: (value: DetailsStepData) => void,
) {
  const { data, updateDetailsStep } = usePurposeWizardContext();

  return useAppForm({
    defaultValues: {
      dailyCalls: data.dailyCalls ?? DETAILS_STEP_DEFAULTS.dailyCalls,
      description: data.description ?? DETAILS_STEP_DEFAULTS.description,
      name: data.name ?? DETAILS_STEP_DEFAULTS.name,
    },
    onSubmit: ({ value }) => {
      updateDetailsStep(value);
      onSubmitSuccess(value);
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: detailsStepSchema,
    },
  });
}

function usePurposeWizardContext() {
  const context = useContext(PurposeWizardContext);
  if (!context) {
    throw new Error(
      "usePurposeWizardContext must be used within a PurposeFormProvider",
    );
  }
  return context;
}
