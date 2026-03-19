import { useCallback, useMemo, useState } from "react";

import type { DetailsStepData } from "@/features/purpose/types/purposeCreateForm";

import {
  PURPOSE_FORM_DEFAULTS,
  type PurposeFormDraftData,
} from "@/features/purpose/types/purposeCreateForm";

import {
  PurposeWizardContext,
  type PurposeWizardContextValue,
} from "./usePurposeFormContext";

export function PurposeFormProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<PurposeFormDraftData>(PURPOSE_FORM_DEFAULTS);

  const updateDetailsStep = useCallback((stepData: DetailsStepData) => {
    setData((prev) => ({ ...prev, ...stepData }));
  }, []);

  const value = useMemo<PurposeWizardContextValue>(
    () => ({
      data,
      updateDetailsStep,
    }),
    [data, updateDetailsStep],
  );

  return (
    <PurposeWizardContext.Provider value={value}>
      {children}
    </PurposeWizardContext.Provider>
  );
}
