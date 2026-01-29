import { createContext, useContext } from "react";

import { useAppForm } from "@/contexts/form";
import { ESERVICE_FORM_DEFAULTS } from "@/features/e-service/types/eserviceCreateForm";

export function useEServiceAppForm() {
  return useAppForm({ defaultValues: ESERVICE_FORM_DEFAULTS });
}

// eslint-disable-next-line perfectionist/sort-modules -- type depends on function above
export type EServiceForm = ReturnType<typeof useEServiceAppForm>;

const EServiceFormContext = createContext<EServiceForm | null>(null);

export const EServiceFormProvider = EServiceFormContext.Provider;

export function useEServiceForm(): EServiceForm {
  const form = useContext(EServiceFormContext);
  if (!form) {
    throw new Error("useEServiceForm must be used within EServiceFormProvider");
  }
  return form;
}
