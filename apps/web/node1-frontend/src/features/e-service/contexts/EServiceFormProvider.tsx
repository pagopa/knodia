import type { bffApi } from "@knodia/bff-client";

import { useCallback, useMemo, useState } from "react";

import type {
  AttributesStepData,
  DocsStepData,
  EServiceFormDraftData,
  GeneralStepData,
  TechnicalStepData,
  TemplateDocsStepData,
} from "@/features/e-service/types/eserviceCreateForm";

import {
  ESERVICE_FORM_DEFAULTS,
  EServiceWizardContext,
  type EServiceWizardContextValue,
} from "./useEServiceFormContext";

export function EServiceFormProvider({
  children,
  template,
}: {
  children: React.ReactNode;
  template: bffApi.EserviceTemplateDetails | undefined;
}) {
  const [data, setData] = useState<EServiceFormDraftData>({
    ...ESERVICE_FORM_DEFAULTS,
    ...(template
      ? {
          categories: template.eserviceFields.categories,
          mode: template.eserviceFields.mode,
          requiredAttributes: template.eserviceFields.requiredAttributes,
        }
      : {}),
  });

  const updateGeneralStep = useCallback((stepData: GeneralStepData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const updateTechnicalStep = useCallback((stepData: TechnicalStepData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const updateDocsStep = useCallback(
    (stepData: DocsStepData | TemplateDocsStepData) => {
      setData((prev) => ({ ...prev, ...stepData }));
    },
    [],
  );

  const updateTemplateDocsStep = useCallback(
    (stepData: TemplateDocsStepData) => {
      setData((prev) => ({ ...prev, ...stepData }));
    },
    [],
  );

  const updateAttributesStep = useCallback((stepData: AttributesStepData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const value = useMemo<EServiceWizardContextValue>(
    () => ({
      data,
      template,
      updateAttributesStep,
      updateDocsStep,
      updateGeneralStep,
      updateTechnicalStep,
      updateTemplateDocsStep,
    }),
    [
      data,
      template,
      updateAttributesStep,
      updateDocsStep,
      updateGeneralStep,
      updateTemplateDocsStep,
      updateTechnicalStep,
    ],
  );

  return (
    <EServiceWizardContext.Provider value={value}>
      {children}
    </EServiceWizardContext.Provider>
  );
}
