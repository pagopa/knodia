/* eslint-disable react-refresh/only-export-components */
import { UISignupSessionTokenClaims } from "@knodia/common-models/auth";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import z from "zod";

export interface AuthContext {
  isAuthenticated: boolean;
  logout: () => void;
  sessionToken: null | string;
  sessionTokenClaims: null | UISignupSessionTokenClaims;
  setSessionToken: (sessionToken: string) => void;
}

const AuthContext = createContext<AuthContext | null>(null);

const key = "sessionToken";
const UISignupSessionToken = z
  .string()
  .transform((token, ctx) => {
    const payload = token.split(".")[1];

    if (!payload) {
      ctx.addIssue({
        code: "custom",
        message: "Invalid JWT: missing payload",
      });
      return z.NEVER;
    }

    try {
      return JSON.parse(window.atob(payload)) as unknown;
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Invalid JWT: payload is not valid JSON",
      });
      return z.NEVER;
    }
  })
  .pipe(UISignupSessionTokenClaims);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionToken, setSessionTokenState] = useState<null | string>(
    getStoredSessionToken(),
  );
  const isAuthenticated = !!sessionToken;

  const sessionTokenClaims = useMemo(() => {
    if (!sessionToken) {
      return null;
    }

    try {
      return UISignupSessionToken.parse(sessionToken);
    } catch (error) {
      console.warn("Failed to decode UI signup session token claims", error);
      throw error;
    }
  }, [sessionToken]);

  const logout = useCallback(() => {
    setStoredSessionToken(null);
    setSessionTokenState(null);
  }, []);

  const setSessionToken = useCallback((newSessionToken: string) => {
    setStoredSessionToken(newSessionToken);
    setSessionTokenState(newSessionToken);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        logout,
        sessionToken,
        sessionTokenClaims,
        setSessionToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function getStoredSessionToken() {
  return localStorage.getItem(key);
}

export function setStoredSessionToken(sessionToken: null | string) {
  if (sessionToken) {
    localStorage.setItem(key, sessionToken);
  } else {
    localStorage.removeItem(key);
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
