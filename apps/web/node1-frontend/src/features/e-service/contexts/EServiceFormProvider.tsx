import { useCallback, useMemo, useState } from "react";

import type {
  AttributesStepData,
  DocsStepData,
  EServiceValidationFormData,
  GeneralStepData,
  TechnicalStepData,
} from "@/features/e-service/types/eserviceCreateForm";

import {
  ESERVICE_FORM_DEFAULTS,
  EServiceWizardContext,
  type EServiceWizardContextValue,
} from "./useEServiceFormContext";

export function EServiceFormProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<EServiceValidationFormData>(
    ESERVICE_FORM_DEFAULTS,
  );

  const updateGeneralStep = useCallback((stepData: GeneralStepData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const updateTechnicalStep = useCallback((stepData: TechnicalStepData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const updateDocsStep = useCallback((stepData: DocsStepData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const updateAttributesStep = useCallback((stepData: AttributesStepData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const value = useMemo<EServiceWizardContextValue>(
    () => ({
      data,
      updateAttributesStep,
      updateDocsStep,
      updateGeneralStep,
      updateTechnicalStep,
    }),
    [
      data,
      updateAttributesStep,
      updateDocsStep,
      updateGeneralStep,
      updateTechnicalStep,
    ],
  );

  return (
    <EServiceWizardContext.Provider value={value}>
      {children}
    </EServiceWizardContext.Provider>
  );
}
