import { APP_BASE_PATH } from "@/config/basepath";

// Per-tab (sessionStorage) by design: surviving a browser restart is
// anti-feature for a single-flow token, and dying-with-the-tab prevents stale
// tokens leaking into a subsequent magic-link visit.
const EXTERNAL_TOKEN_KEY = "knodia_external_ui_session_token";
// Same-tab notification only: the token is per-tab so the cross-tab `storage`
// event is not relevant. This event lets `useSyncExternalStore` subscribers
// react to writes made outside React (e.g., router beforeLoad hooks).
const EXTERNAL_TOKEN_EVENT = "knodia:external-token-change";

export function clearExternalToken(): void {
  sessionStorage.removeItem(EXTERNAL_TOKEN_KEY);
  window.dispatchEvent(new Event(EXTERNAL_TOKEN_EVENT));
}

export function getExternalToken(): null | string {
  return sessionStorage.getItem(EXTERNAL_TOKEN_KEY);
}

export function redirectToExternalSessionLanding(): void {
  window.location.assign(`${APP_BASE_PATH}/agreement-activation`);
}

export function setExternalToken(token: string): void {
  sessionStorage.setItem(EXTERNAL_TOKEN_KEY, token);
  window.dispatchEvent(new Event(EXTERNAL_TOKEN_EVENT));
}

export function subscribeToExternalToken(onChange: () => void): () => void {
  window.addEventListener(EXTERNAL_TOKEN_EVENT, onChange);
  return () => window.removeEventListener(EXTERNAL_TOKEN_EVENT, onChange);
}
