import type { UserRole } from "@knodia/common-models/auth";
import type { UserId } from "@knodia/common-models/ids";

import { createContext, useContext } from "react";

interface AuthContextValue {
  error?: Error | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  roles: readonly UserRole[];
  token: null | string;
  userId: null | UserId;
  username: null | string;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
