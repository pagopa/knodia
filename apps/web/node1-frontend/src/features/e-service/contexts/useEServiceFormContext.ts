import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { createContext, useContext } from "react";

import { ESERVICE_FORM_DEFAULTS } from "@/features/e-service/types/eserviceCreateForm";

const { fieldContext, formContext } = createFormHookContexts();

const { useAppForm } = createFormHook({
  fieldComponents: {},
  fieldContext,
  formComponents: {},
  formContext,
});

export function useEServiceAppForm() {
  return useAppForm({
    defaultValues: ESERVICE_FORM_DEFAULTS,
    // TODO: add submit handler
    onSubmit: console.log,
  });
}

// eslint-disable-next-line perfectionist/sort-modules -- type depends on function above
type EServiceForm = ReturnType<typeof useEServiceAppForm>;

export const EServiceFormContext = createContext<EServiceForm | null>(null);

// useFormContext from createFormHookContexts does not handle type inference
// unless strongly typed with "as unknown as".
// We need to do use a custom context to pass the correct form type.
export function useEServiceFormContext() {
  const context = useContext(EServiceFormContext);
  if (!context) {
    throw new Error(
      "useEServiceFormContext must be used within an EServiceFormProvider",
    );
  }
  return context;
}
