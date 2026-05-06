import {
  createSessionMutation,
  logoutMutation,
} from "@knodia/bff-client/tanstack-query";
import { UISessionTokenClaims } from "@knodia/common-models/auth";
import { useMutation } from "@tanstack/react-query";
import { decodeJwt } from "jose";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
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

  // removeUser() can throw — ensure cleanup and redirect happen regardless
  const safelyRemoveUser = useCallback(async () => {
    try {
      await removeUser();
    } finally {
      clearAuthToken();
      setUiSessionToken(null);
      redirectToLogout();
    }
  }, [removeUser]);

  const {
    error: exchangeError,
    isPending: isExchangePending,
    mutate: exchangeToken,
  } = useMutation({
    ...createSessionMutation({ client }),
    onError: async () => {
      await safelyRemoveUser();
      void router.navigate({ replace: true, to: "/login" });
    },
    onSuccess: (data) => {
      setAuthToken(data.uiSessionToken);
      setUiSessionToken(data.uiSessionToken);
      void router.navigate({ replace: true, to: "/" });
    },
  });

  const { mutate: bffLogout } = useMutation(
    logoutMutation({ client, withCredentials: true }),
  );

  // After OIDC login completes, exchange the Cognito token for a BFF session.
  useEffect(() => {
    if (user?.id_token && !uiSessionToken) {
      exchangeToken({
        body: { oidcToken: user.id_token },
        withCredentials: true,
      });
    }
  }, [user?.id_token, uiSessionToken, exchangeToken]);

  const sessionClaims = useMemo(() => {
    if (!uiSessionToken) return null;
    try {
      return UISessionTokenClaims.parse(decodeJwt(uiSessionToken));
    } catch (error) {
      console.warn("Failed to decode UI session token claims", error);
      return null;
    }
  }, [uiSessionToken]);

  const login = useCallback(() => {
    void signinRedirect();
  }, [signinRedirect]);

  const logout = useCallback(async () => {
    // Best-effort: clear the refresh token cookie
    bffLogout({ withCredentials: true });
    await safelyRemoveUser();
  }, [bffLogout, safelyRemoveUser]);

  return (
    <AuthContext.Provider
      value={{
        error: oidcError ?? exchangeError,
        isAuthenticated: !!uiSessionToken,
        isLoading: oidcIsLoading || isExchangePending,
        login,
        logout,
        roles: sessionClaims?.roles ?? [],
        token: uiSessionToken,
        userId: sessionClaims?.sub ?? null,
        username: sessionClaims?.username ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
