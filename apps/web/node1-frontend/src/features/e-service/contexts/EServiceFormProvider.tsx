import { useCallback, useMemo, useState } from "react";

import type { EServiceFormData } from "@/features/e-service/types/eserviceCreateForm";

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
  const [data, setData] = useState<Partial<EServiceFormData>>(
    ESERVICE_FORM_DEFAULTS,
  );

  const updateGeneralStep = useCallback<
    EServiceWizardContextValue["updateGeneralStep"]
  >((stepData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const updateTechnicalStep = useCallback<
    EServiceWizardContextValue["updateTechnicalStep"]
  >((stepData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const updateDocsStep = useCallback<
    EServiceWizardContextValue["updateDocsStep"]
  >((stepData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const updateAttributesStep = useCallback<
    EServiceWizardContextValue["updateAttributesStep"]
  >((stepData) => {
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
