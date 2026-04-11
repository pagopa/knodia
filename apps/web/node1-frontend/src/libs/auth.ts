import { config } from "@/config/config";

/*
 * The UI session token (short-lived, minutes) is stored in localStorage and
 * sent as an explicit Authorization: Bearer header.
 *
 * The refresh token (long-lived, days) needs stronger protection — if stolen,
 * it can mint new session tokens until it expires. It is stored in an HttpOnly
 * cookie, invisible to JavaScript, and only sent to the BFF's /auth endpoints
 * (Path=/auth, SameSite=Strict).
 */
const AUTH_TOKEN_KEY = "knodia_auth_token";

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getAuthToken(): null | string {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

// Cognito does not support OIDC RP-Initiated Logout (end_session_endpoint),
// so we perform logout by redirecting to Cognito's proprietary /logout endpoint via window.location
export function redirectToLogout(): void {
  const { clientId, domain, logoutUri } = config.cognito;
  window.location.href = `${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}
