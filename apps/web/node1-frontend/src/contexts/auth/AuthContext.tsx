import { type ReactNode, useCallback, useState } from "react";

import { clearAuthToken, getAuthToken, setAuthToken } from "@/libs/auth";

import { AuthContext } from "./useAuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<null | string>(() => getAuthToken());

  const setToken = useCallback((newToken: string) => {
    setAuthToken(newToken);
    setTokenState(newToken);
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setTokenState(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: !!token, logout, setToken, token }}
    >
      {children}
    </AuthContext.Provider>
  );
}
