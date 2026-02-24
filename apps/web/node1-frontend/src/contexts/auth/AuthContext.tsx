import type { User } from "oidc-client-ts";

import { createSessionMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation } from "@tanstack/react-query";
import { type ReactNode, useCallback, useState } from "react";
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
export function OidcAuthProvider({ children }: { children: ReactNode }) {
  const [uiSessionToken, setUiSessionToken] = useState<null | string>(
    getAuthToken,
  );

  const tokenExchange = useMutation({
    ...createSessionMutation(),
    onSuccess: (data) => {
      setAuthToken(data.token);
      setUiSessionToken(data.token);
    },
  });

  const handleSigninCallback = useCallback(
    (user?: User) => {
      if (user?.access_token && !getAuthToken()) {
        tokenExchange.mutate({
          headers: { Authorization: `Bearer ${user.access_token}` },
        });
      }
    },
    [tokenExchange],
  );

  return (
    <OidcProvider
      authority={config.cognito.authority}
      client_id={config.cognito.clientId}
      onSigninCallback={handleSigninCallback}
      redirect_uri={config.cognito.redirectUri}
      scope="openid"
    >
      <AuthStateProvider
        setUiSessionToken={setUiSessionToken}
        uiSessionToken={uiSessionToken}
      >
        {children}
      </AuthStateProvider>
    </OidcProvider>
  );
}

function AuthStateProvider({
  children,
  setUiSessionToken,
  uiSessionToken,
}: {
  children: ReactNode;
  setUiSessionToken: (token: null | string) => void;
  uiSessionToken: null | string;
}) {
  const oidcAuth = useOidcAuth();

  const logout = useCallback(() => {
    clearAuthToken();
    setUiSessionToken(null);
    void oidcAuth.removeUser();
  }, [oidcAuth, setUiSessionToken]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!uiSessionToken,
        logout,
        token: uiSessionToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
