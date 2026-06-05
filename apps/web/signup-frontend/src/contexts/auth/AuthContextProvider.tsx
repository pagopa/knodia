import { UISignupSessionTokenClaims } from "@knodia/common-models/auth";
import { decodeJwt } from "jose";
import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  clearAuthToken,
  redirectToLogin,
  sessionTokenStore,
} from "@/libs/auth";

import { AuthContext } from "./AuthContext";

export function AuthContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionToken = useSyncExternalStore(
    sessionTokenStore.subscribe,
    sessionTokenStore.getSnapshot,
  );
  const isAuthenticated = !!sessionToken;

  const sessionTokenClaims = useMemo(() => {
    if (!sessionToken) {
      return null;
    }

    try {
      return UISignupSessionTokenClaims.parse(decodeJwt(sessionToken));
    } catch (error) {
      console.warn("Failed to decode UI signup session token claims", error);
      throw error;
    }
  }, [sessionToken]);

  const logout = useCallback(() => {
    clearAuthToken();
    redirectToLogin();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        logout,
        sessionToken,
        sessionTokenClaims,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
