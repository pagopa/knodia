import type { bffApi } from "@knodia/bff-client";

import {
  createFormHook,
  createFormHookContexts,
  revalidateLogic,
} from "@tanstack/react-form";
import { createContext, useContext } from "react";

import {
  ATTRIBUTES_STEP_DEFAULTS,
  type AttributesStepData,
  attributesStepSchema,
  DOCS_STEP_DEFAULTS,
  type DocsStepData,
  docsStepSchema,
  ESERVICE_FORM_DEFAULTS,
  type EServiceFormDraftData,
  GENERAL_STEP_DEFAULTS,
  type GeneralStepData,
  generalStepSchema,
  TECHNICAL_STEP_DEFAULTS,
  type TechnicalStepData,
  technicalStepSchema,
  TEMPLATE_DOCS_STEP_DEFAULTS,
  type TemplateDocsStepData,
  templateDocsStepSchema,
} from "@/features/e-service/types/eserviceCreateForm";

// Wizard context for accumulated data
export interface EServiceWizardContextValue {
  data: EServiceFormDraftData;
  template: bffApi.EserviceTemplateDetails | undefined;
  updateAttributesStep: (data: AttributesStepData) => void;
  updateDocsStep: (data: DocsStepData | TemplateDocsStepData) => void;
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
    defaultValues: {
      requiredAttributes:
        data.requiredAttributes ?? ATTRIBUTES_STEP_DEFAULTS.requiredAttributes,
    },
    onSubmit: ({ value }) => {
      updateAttributesStep(value);
      onSubmitSuccess();
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: attributesStepSchema,
    },
  });
}

export function useDocsStepForm(onSubmitSuccess: () => void) {
  const { data, template, updateDocsStep } = useEServiceWizardContext();

  const defaultValues = template
    ? {
        contactEmail:
          data.contactEmail ?? TEMPLATE_DOCS_STEP_DEFAULTS.contactEmail,
        contactName:
          data.contactName ?? TEMPLATE_DOCS_STEP_DEFAULTS.contactName,
        contactUrl: data.contactUrl ?? TEMPLATE_DOCS_STEP_DEFAULTS.contactUrl,
        serverUrls: data.serverUrls ?? TEMPLATE_DOCS_STEP_DEFAULTS.serverUrls,
        termsOfServiceUrl:
          data.termsOfServiceUrl ??
          TEMPLATE_DOCS_STEP_DEFAULTS.termsOfServiceUrl,
      }
    : {
        interfaceDocument:
          data.interfaceDocument ?? DOCS_STEP_DEFAULTS.interfaceDocument,
      };

  const schema = template ? templateDocsStepSchema : docsStepSchema;

  return useAppForm({
    defaultValues,
    onSubmit: ({ value }) => {
      // Already validated by onDynamic, re-parse only to narrow File | null → File
      const parsedValue = schema.parse(value);
      updateDocsStep(parsedValue);
      onSubmitSuccess();
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: schema,
    },
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
    defaultValues: {
      categories: data.categories ?? GENERAL_STEP_DEFAULTS.categories,
      description: data.description ?? GENERAL_STEP_DEFAULTS.description,
      name: data.name ?? GENERAL_STEP_DEFAULTS.name,
    },
    onSubmit: ({ value }) => {
      updateGeneralStep(value);
      onSubmitSuccess();
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: generalStepSchema,
    },
  });
}

export function useTechnicalStepForm(onSubmitSuccess: () => void) {
  const { data, updateTechnicalStep } = useEServiceWizardContext();

  return useAppForm({
    defaultValues: {
      accessTokenAudience:
        data.accessTokenAudience ?? TECHNICAL_STEP_DEFAULTS.accessTokenAudience,
      accessTokenDuration:
        data.accessTokenDuration ?? TECHNICAL_STEP_DEFAULTS.accessTokenDuration,
      accessTokenType:
        data.accessTokenType ?? TECHNICAL_STEP_DEFAULTS.accessTokenType,
      isSignalHubEnabled:
        data.isSignalHubEnabled ?? TECHNICAL_STEP_DEFAULTS.isSignalHubEnabled,
      maxDailyCallsPerConsumer:
        data.maxDailyCallsPerConsumer ??
        TECHNICAL_STEP_DEFAULTS.maxDailyCallsPerConsumer,
      maxDailyCallsPerKnode:
        data.maxDailyCallsPerKnode ??
        TECHNICAL_STEP_DEFAULTS.maxDailyCallsPerKnode,
      mode: data.mode ?? TECHNICAL_STEP_DEFAULTS.mode,
    },
    onSubmit: ({ value }) => {
      updateTechnicalStep(value);
      onSubmitSuccess();
    },
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: technicalStepSchema,
    },
  });
}

// Export defaults for initial state
export { ESERVICE_FORM_DEFAULTS };
