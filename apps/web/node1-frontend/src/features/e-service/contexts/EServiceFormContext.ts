import { createContext, useContext } from "react";

import type { useAppForm } from "@/contexts/form";
import type { EServiceFormData } from "@/features/e-service/types/eserviceCreateForm";

type EServiceForm = ReturnType<typeof useAppForm<EServiceFormData>>;

const EServiceFormContext = createContext<EServiceForm | null>(null);

export const EServiceFormProvider = EServiceFormContext.Provider;

export function useEServiceForm(): EServiceForm {
  const form = useContext(EServiceFormContext);
  if (!form) {
    throw new Error("useEServiceForm must be used within EServiceFormProvider");
  }
  return form;
}
