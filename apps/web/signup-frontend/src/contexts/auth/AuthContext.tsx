import type { UISignupSessionTokenClaims } from "@knodia/common-models/auth";

import { createContext } from "react";

export interface AuthContext {
  isAuthenticated: boolean;
  logout: () => void;
  sessionToken: null | string;
  sessionTokenClaims: null | UISignupSessionTokenClaims;
}

export const AuthContext = createContext<AuthContext | null>(null);
