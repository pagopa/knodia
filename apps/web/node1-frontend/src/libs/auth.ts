import { config } from "@/config/config";

const AUTH_TOKEN_KEY = "knodia_auth_token";

export function clearAuthToken(): void {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getAuthToken(): null | string {
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

// Cognito does not support OIDC RP-Initiated Logout (end_session_endpoint),
// so we perform logout by redirecting to Cognito's proprietary /logout endpoint via window.location
export function redirectToLogout(): void {
  const { clientId, domain, logoutUri } = config.cognito;
  window.location.href = `${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
}

export function setAuthToken(token: string): void {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}
