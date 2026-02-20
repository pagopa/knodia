const AUTH_TOKEN_KEY = "knodia_auth_token";

export function getAuthToken(): null | string {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}
