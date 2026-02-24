import { createContext, useContext } from "react";

interface AuthContextValue {
  isAuthenticated: boolean;
  logout: () => void;
  token: null | string;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
