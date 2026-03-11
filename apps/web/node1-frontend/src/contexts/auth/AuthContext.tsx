import {
  createSessionMutation,
  refreshSessionMutation,
} from "@knodia/bff-client/tanstack-query";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  AuthProvider as OidcProvider,
  useAuth as useOidcAuth,
} from "react-oidc-context";

import { config } from "@/config/config";
import {
  clearAuthToken,
  getAuthToken,
  redirectToLogout,
  setAuthToken,
} from "@/libs/auth";
import { client } from "@/libs/axios";
import { router } from "@/libs/router";

import { AuthContext } from "./useAuthContext";

/**
 * Wraps react-oidc-context's AuthProvider with OIDC configuration
 * and token exchange logic. After OIDC login, exchanges the Cognito
 * access_token for a ui-session token via the BFF.
 *
 * On new tabs (empty sessionStorage), attempts a silent refresh via
 * the HttpOnly refresh cookie before falling back to OIDC login.
 */
export function OidcAuthProvider({ children }: { children: ReactNode }) {
  return (
    <OidcProvider
      authority={config.cognito.authority}
      client_id={config.cognito.clientId}
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

  const {
    error: exchangeError,
    isPending: isExchangePending,
    mutate: exchangeToken,
  } = useMutation({
    ...createSessionMutation({ client }),
    onError: () => {
      redirectToLogout();
    },
    onSuccess: (data) => {
      setAuthToken(data.uiSessionToken);
      setUiSessionToken(data.uiSessionToken);
      void router.navigate({ replace: true, to: "/" });
    },
  });

  const {
    isIdle: isRefreshIdle,
    isPending: isRefreshPending,
    mutate: refreshFromCookie,
  } = useMutation({
    ...refreshSessionMutation({ client }),
    onSuccess: (data) => {
      setAuthToken(data.uiSessionToken);
      setUiSessionToken(data.uiSessionToken);
    },
    // onError intentionally omitted: silent failure means the user
    // is simply not authenticated and will be redirected to login.
  });

  // On mount, if sessionStorage is empty, attempt to recover the session
  // from the HttpOnly refresh cookie (e.g. new tab, page restored by browser).
  useEffect(() => {
    if (!uiSessionToken && !user?.access_token && isRefreshIdle) {
      refreshFromCookie({ withCredentials: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- bootstrap only

  // After OIDC login completes, exchange the Cognito token for a BFF session.
  useEffect(() => {
    if (user?.access_token && !uiSessionToken) {
      exchangeToken({
        body: { oidcToken: user.access_token },
        withCredentials: true,
      });
    }
  }, [user?.access_token, uiSessionToken, exchangeToken]);

  const login = useCallback(() => {
    void signinRedirect();
  }, [signinRedirect]);

  const logout = useCallback(async () => {
    // Call BFF logout to clear the refresh token cookie
    try {
      await axios.post(`${config.bffUrl}/auth/logout`, undefined, {
        withCredentials: true,
      });
    } catch {
      // Best-effort: proceed with logout even if the call fails
    }

    // removeUser() can throw — ensure cleanup and redirect happen regardless
    try {
      await removeUser();
    } finally {
      clearAuthToken();
      setUiSessionToken(null);
      redirectToLogout();
    }
  }, [removeUser]);

  return (
    <AuthContext.Provider
      value={{
        error: oidcError ?? exchangeError,
        isAuthenticated: !!uiSessionToken,
        isLoading: oidcIsLoading || isExchangePending || isRefreshPending,
        login,
        logout,
        token: uiSessionToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
