import type { EserviceId, KnodeId } from "@knodia/common-models/ids";

import {
  createFormHook,
  createFormHookContexts,
  revalidateLogic,
} from "@tanstack/react-form";
import { createContext, useContext } from "react";

import type { FormValues, JsonSchema } from "@/features/purpose/engine/types";

import { getDefaultValues } from "@/features/purpose/engine/schemaParser";
import {
  DETAILS_STEP_DEFAULTS,
  type DetailsStepData,
  detailsStepSchema,
  type PurposeFormDraftData,
} from "@/features/purpose/types/purposeCreateForm";

export interface PurposeWizardContextValue {
  data: PurposeFormDraftData;
  eserviceId: EserviceId;
  eserviceName: string;
  formAnswers: FormValues;
  formSchemaVersion: string;
  knodeId: KnodeId;
  maxDailyCallsPerConsumer: number;
  updateDetailsStep: (data: DetailsStepData) => void;
  updateFormAnswers: (answers: FormValues) => void;
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
  const { data, maxDailyCallsPerConsumer, updateDetailsStep } =
    usePurposeWizardContext();

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
      onDynamic: detailsStepSchema(maxDailyCallsPerConsumer),
    },
  });
}

export function useDynamicStepForm(opts: {
  formAnswers: FormValues;
  jsonSchema: JsonSchema;
  onDynamic: (params: {
    value: FormValues;
  }) => undefined | { fields: Record<string, string> };
  onSubmitSuccess: (value: FormValues) => void;
}) {
  return useAppForm({
    defaultValues: {
      ...getDefaultValues(opts.jsonSchema),
      ...opts.formAnswers,
    } as FormValues,
    onSubmit: ({ value }) => opts.onSubmitSuccess(value),
    onSubmitInvalid: () => {
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: opts.onDynamic,
    },
  });
}

export function usePurposeWizardContext() {
  const context = useContext(PurposeWizardContext);
  if (!context) {
    throw new Error(
      "usePurposeWizardContext must be used within a PurposeFormProvider",
    );
  }
  return context;
}
