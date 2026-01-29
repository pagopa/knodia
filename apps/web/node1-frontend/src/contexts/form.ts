import { createFormHook, createFormHookContexts } from "@tanstack/react-form";

const { fieldContext, formContext } = createFormHookContexts();

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {},
  fieldContext,
  formComponents: {},
  formContext,
});

export type AppForm<
  TFormData extends Record<string, unknown> = Record<string, unknown>,
> = ReturnType<typeof useAppForm<TFormData>>;
