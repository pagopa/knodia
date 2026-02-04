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
export function useAttributesStepForm(
  defaultValues?: Partial<AttributesStepData>,
  onSubmit?: (data: AttributesStepData) => void,
) {
  return useAppForm({
    defaultValues: { ...ATTRIBUTES_STEP_DEFAULTS, ...defaultValues },
    onSubmit: ({ value }) => onSubmit?.(value),
    validators: { onChange: attributesStepSchema },
  });
}

export function useDocsStepForm(
  defaultValues?: Partial<DocsStepData>,
  onSubmit?: (data: DocsStepData) => void,
) {
  return useAppForm({
    defaultValues: { ...DOCS_STEP_DEFAULTS, ...defaultValues },
    onSubmit: ({ value }) => onSubmit?.(value),
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

export function useGeneralStepForm(
  defaultValues?: Partial<GeneralStepData>,
  onSubmit?: (data: GeneralStepData) => void,
) {
  return useAppForm({
    defaultValues: { ...GENERAL_STEP_DEFAULTS, ...defaultValues },
    onSubmit: ({ value }) => onSubmit?.(value),
    validators: { onChange: generalStepSchema },
  });
}

export function useTechnicalStepForm(
  defaultValues?: Partial<TechnicalStepData>,
  onSubmit?: (data: TechnicalStepData) => void,
) {
  return useAppForm({
    defaultValues: { ...TECHNICAL_STEP_DEFAULTS, ...defaultValues },
    onSubmit: ({ value }) => onSubmit?.(value),
    validators: { onChange: technicalStepSchema },
  });
}

// Export defaults for initial state
export { ESERVICE_FORM_DEFAULTS };
