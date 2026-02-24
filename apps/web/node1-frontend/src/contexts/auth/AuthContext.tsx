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
import { client } from "@/libs/axios";

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

  const { error, mutate } = useMutation({
    ...createSessionMutation({ client }),
    onSuccess: (data) => {
      setAuthToken(data.token);
      setUiSessionToken(data.token);
    },
  });

  const handleSigninCallback = useCallback(
    (user?: User) => {
      if (user?.access_token && !getAuthToken()) {
        mutate({
          headers: { Authorization: `Bearer ${user.access_token}` },
        });
      }
    },
    [mutate],
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
        exchangeError={error}
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
  exchangeError,
  setUiSessionToken,
  uiSessionToken,
}: {
  children: ReactNode;
  exchangeError?: Error | null;
  setUiSessionToken: (token: null | string) => void;
  uiSessionToken: null | string;
}) {
  const oidcAuth = useOidcAuth();

  const login = useCallback(() => {
    void oidcAuth.signinRedirect();
  }, [oidcAuth]);

  const logout = useCallback(() => {
    clearAuthToken();
    setUiSessionToken(null);
    void oidcAuth.removeUser();
  }, [oidcAuth, setUiSessionToken]);

  return (
    <AuthContext.Provider
      value={{
        error: oidcAuth.error ?? exchangeError,
        isAuthenticated: !!uiSessionToken,
        isLoading: oidcAuth.isLoading,
        login,
        logout,
        token: uiSessionToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
