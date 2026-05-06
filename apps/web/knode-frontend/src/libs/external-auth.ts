import { APP_BASE_PATH } from "@/config/basepath";

// Per-tab (sessionStorage) by design: surviving a browser restart is
// anti-feature for a single-flow token, and dying-with-the-tab prevents stale
// tokens leaking into a subsequent magic-link visit.
const EXTERNAL_TOKEN_KEY = "knodia_external_ui_session_token";

export function clearExternalToken(): void {
  sessionStorage.removeItem(EXTERNAL_TOKEN_KEY);
}

export function getExternalToken(): null | string {
  return sessionStorage.getItem(EXTERNAL_TOKEN_KEY);
}

export function redirectToExternalSessionLanding(): void {
  window.location.assign(`${APP_BASE_PATH}/agreement-activation`);
}

export function setExternalToken(token: string): void {
  sessionStorage.setItem(EXTERNAL_TOKEN_KEY, token);
}
