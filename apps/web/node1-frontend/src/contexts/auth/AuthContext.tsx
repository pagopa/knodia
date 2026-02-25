import { createSessionMutation } from "@knodia/bff-client/tanstack-query";
import { useMutation } from "@tanstack/react-query";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  AuthProvider as OidcProvider,
  useAuth as useOidcAuth,
} from "react-oidc-context";

import { config } from "@/config/config";
import {
  clearAllTokens,
  getAuthToken,
  setAuthToken,
  setRefreshToken,
} from "@/libs/auth";
import { client } from "@/libs/axios";

import { AuthContext } from "./useAuthContext";

/**
 * Wraps react-oidc-context's AuthProvider with OIDC configuration
 * and token exchange logic. After OIDC login, exchanges the Cognito
 * access_token for a ui-session token via the BFF.
 */
export function OidcAuthProvider({ children }: { children: ReactNode }) {
  return (
    <OidcProvider
      authority={config.cognito.authority}
      client_id={config.cognito.clientId}
      post_logout_redirect_uri={config.cognito.postLogoutRedirectUri}
      redirect_uri={config.cognito.redirectUri}
      scope="openid"
    >
      <AuthStateProvider>{children}</AuthStateProvider>
    </OidcProvider>
  );
}

function AuthStateProvider({ children }: { children: ReactNode }) {
  const [uiSessionToken, setUiSessionToken] = useState<null | string>(
    getAuthToken,
  );

  const {
    error: oidcError,
    isLoading: oidcIsLoading,
    removeUser,
    signinRedirect,
    user,
  } = useOidcAuth();

  const signOutRedirect = () => {
    const { clientId, domain, postLogoutRedirectUri } = config.cognito;
    window.location.href = `${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(postLogoutRedirectUri)}`;
  };

  const {
    error: exchangeError,
    isPending: isExchangePending,
    mutate,
  } = useMutation({
    ...createSessionMutation({ client }),
    onError: () => {
      void signOutRedirect();
    },
    onSuccess: (data) => {
      setAuthToken(data.uiSessionToken);
      setRefreshToken(data.refreshToken);
      setUiSessionToken(data.uiSessionToken);
    },
  });

  useEffect(() => {
    if (user?.access_token && !uiSessionToken) {
      mutate({ body: { oidcToken: user.access_token } });
    }
  }, [user?.access_token, uiSessionToken, mutate]);

  const login = useCallback(() => {
    void signinRedirect();
  }, [signinRedirect]);

  const logout = useCallback(async () => {
    // Must be done in this order to ensure that the OIDC user is removed before the token is cleared
    await removeUser();
    clearAllTokens();
    setUiSessionToken(null);
    signOutRedirect();
  }, [removeUser]);

  return (
    <AuthContext.Provider
      value={{
        error: oidcError ?? exchangeError,
        isAuthenticated: !!uiSessionToken,
        isLoading: oidcIsLoading || isExchangePending,
        login,
        logout,
        token: uiSessionToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
