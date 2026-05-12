import { createContext, useContext } from "react";

interface ExternalAuthContextValue {
  acceptSession: (token: string) => void;
  endSession: () => void;
  token: null | string;
}

export const ExternalAuthContext =
  createContext<ExternalAuthContextValue | null>(null);

export function useExternalAuth(): ExternalAuthContextValue {
  const context = useContext(ExternalAuthContext);
  if (!context) {
    throw new Error("useExternalAuth must be used within ExternalAuthProvider");
  }
  return context;
}
