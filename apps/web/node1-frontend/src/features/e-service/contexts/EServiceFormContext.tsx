import {
  EServiceFormContext,
  useEServiceAppForm,
} from "./useEServiceFormContext";

export function EServiceFormProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const form = useEServiceAppForm();
  return (
    <EServiceFormContext.Provider value={form}>
      {children}
    </EServiceFormContext.Provider>
  );
}
