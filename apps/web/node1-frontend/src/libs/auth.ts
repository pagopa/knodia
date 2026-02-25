const AUTH_TOKEN_KEY = "knodia_auth_token";
const REFRESH_TOKEN_KEY = "knodia_refresh_token";

export function clearAllTokens(): void {
  clearAuthToken();
  clearRefreshToken();
}

export function getAuthToken(): null | string {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getRefreshToken(): null | string {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function clearRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}
