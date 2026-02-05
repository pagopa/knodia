import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { createContext, useContext } from "react";

import type {
  AttributesStepData,
  DocsStepData,
  EServiceFormData,
  GeneralStepData,
  TechnicalStepData,
} from "@/features/e-service/types/eserviceCreateForm";

import {
  ATTRIBUTES_STEP_DEFAULTS,
  attributesStepSchema,
  DOCS_STEP_DEFAULTS,
  docsStepSchema,
  ESERVICE_FORM_DEFAULTS,
  GENERAL_STEP_DEFAULTS,
  generalStepSchema,
  TECHNICAL_STEP_DEFAULTS,
  technicalStepSchema,
} from "@/features/e-service/types/eserviceCreateForm";

// Wizard context for accumulated data
export interface EServiceWizardContextValue {
  data: Partial<EServiceFormData>;
  updateAttributesStep: (data: AttributesStepData) => void;
  updateDocsStep: (data: DocsStepData) => void;
  updateGeneralStep: (data: GeneralStepData) => void;
  updateTechnicalStep: (data: TechnicalStepData) => void;
}

export const EServiceWizardContext =
  createContext<EServiceWizardContextValue | null>(null);

// Form hook setup
const { fieldContext, formContext } = createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldComponents: {},
  fieldContext,
  formComponents: {},
  formContext,
});

// Step form hooks
export function useAttributesStepForm(onSubmitSuccess: () => void) {
  const { data, updateAttributesStep } = useEServiceWizardContext();

  return useAppForm({
    defaultValues: { ...ATTRIBUTES_STEP_DEFAULTS, ...data },
    onSubmit: ({ value }) => {
      updateAttributesStep(value);
      onSubmitSuccess();
    },
    validators: { onChange: attributesStepSchema },
  });
}

export function useDocsStepForm(onSubmitSuccess: () => void) {
  const { data, updateDocsStep } = useEServiceWizardContext();

  return useAppForm({
    defaultValues: { ...DOCS_STEP_DEFAULTS, ...data },
    onSubmit: ({ value }) => {
      updateDocsStep(value);
      onSubmitSuccess();
    },
    validators: { onChange: docsStepSchema },
  });
}

export function useEServiceWizardContext() {
  const context = useContext(EServiceWizardContext);
  if (!context) {
    throw new Error(
      "useEServiceWizardContext must be used within an EServiceWizardProvider",
    );
  }
  return context;
}

export function useGeneralStepForm(onSubmitSuccess: () => void) {
  const { data, updateGeneralStep } = useEServiceWizardContext();

  return useAppForm({
    defaultValues: { ...GENERAL_STEP_DEFAULTS, ...data },
    onSubmit: ({ value }) => {
      updateGeneralStep(value);
      onSubmitSuccess();
    },
    validators: { onChange: generalStepSchema },
  });
}

export function useTechnicalStepForm(onSubmitSuccess: () => void) {
  const { data, updateTechnicalStep } = useEServiceWizardContext();

  return useAppForm({
    defaultValues: { ...TECHNICAL_STEP_DEFAULTS, ...data },
    onSubmit: ({ value }) => {
      updateTechnicalStep(value);
      onSubmitSuccess();
    },
    validators: { onChange: technicalStepSchema },
  });
}

// Export defaults for initial state
export { ESERVICE_FORM_DEFAULTS };
