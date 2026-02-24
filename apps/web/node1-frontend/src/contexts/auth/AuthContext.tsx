import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  AuthProvider as OidcProvider,
  useAuth as useOidcAuth,
} from "react-oidc-context";

import { config } from "@/config/config";
import { clearAuthToken, getAuthToken, setAuthToken } from "@/libs/auth";

import { AuthContext } from "./useAuthContext";

/**
 * Wraps react-oidc-context's AuthProvider with OIDC configuration
 * and token exchange logic. After OIDC login, exchanges the Cognito
 * access_token for a ui-session token via the BFF.
 */
export function OidcAuthProvider({
  children,
  onSigninCallback,
}: {
  children: ReactNode;
  onSigninCallback?: () => void;
}) {
  return (
    <OidcProvider
      authority={config.cognito.authority}
      client_id={config.cognito.clientId}
      onSigninCallback={onSigninCallback}
      redirect_uri={config.cognito.redirectUri}
      scope="openid"
    >
      <TokenExchangeProvider>{children}</TokenExchangeProvider>
    </OidcProvider>
  );
}

function TokenExchangeProvider({ children }: { children: ReactNode }) {
  const oidcAuth = useOidcAuth();
  const [uiSessionToken, setUiSessionToken] = useState<null | string>(
    getAuthToken,
  );
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

  // Based on BFF ui-session token (localStorage), not OIDC state (sessionStorage),
  // so closing the tab doesn't force re-login.
  const isAuthenticated = !!uiSessionToken;

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
