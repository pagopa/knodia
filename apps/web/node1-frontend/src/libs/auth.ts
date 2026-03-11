import { config } from "@/config/config";

/*
 * The UI session token lives in localStorage so it persists across tabs.
 * It is sent as Authorization: Bearer on every API call — moving it to an
 * HttpOnly cookie would require proxying all protected routes through the BFF.
 * XSS can still read it; its TTL should be configured to be short (minutes)
 * to limit the exposure window.
 * The refresh token (24h) is the higher-value target and is stored in an
 * HttpOnly cookie, which the browser sends automatically but JavaScript
 * cannot access via document.cookie or any other API.
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
