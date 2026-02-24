import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useAuth as useOidcAuth } from "react-oidc-context";

import { config } from "@/config/config";
import { clearAuthToken, setAuthToken } from "@/libs/auth";

import { AuthContext } from "./useAuthContext";

/**
 * OIDC AuthProvider — must be rendered inside react-oidc-context's AuthProvider.
 * After OIDC login, exchanges the Cognito access_token for a ui-session token
 * via the BFF, and exposes that token through AuthContext.
 */
export function OidcAuthProvider({ children }: { children: ReactNode }) {
  const oidcAuth = useOidcAuth();
  const [uiSessionToken, setUiSessionToken] = useState<null | string>(null);
  const accessToken = oidcAuth.user?.access_token;

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;

    fetch(`${config.bffUrl}/auth/ui-session`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
        return res.json() as Promise<{ token: string }>;
      })
      .then((data) => {
        if (!cancelled) {
          setAuthToken(data.token);
          setUiSessionToken(data.token);
        }
      })
      .catch((err) => {
        console.error("Token exchange failed:", err);
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const isAuthenticated = oidcAuth.isAuthenticated && !!uiSessionToken;

  const logout = useCallback(() => {
    clearAuthToken();
    setUiSessionToken(null);
    void oidcAuth.removeUser();
  }, [oidcAuth]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        logout,
        token: uiSessionToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
