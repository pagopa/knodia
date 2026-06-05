const AUTH_TOKEN_KEY = "knodia_signup_auth_token";

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  notifyStorageChange();
}

export function getAuthToken(): null | string {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function redirectToLogin(): void {
  window.location.assign("/login");
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  notifyStorageChange();
}

const listeners = new Set<() => void>();
function notifyStorageChange() {
  listeners.forEach((listener) => listener());
}
export const sessionTokenStore = {
  getSnapshot: getAuthToken,
  subscribe(onStoreChange: () => void) {
    listeners.add(onStoreChange);

    const onStorage = (event: StorageEvent) => {
      if (event.storageArea === localStorage && event.key === AUTH_TOKEN_KEY) {
        onStoreChange();
      }
    };

    window.addEventListener("storage", onStorage);

    return () => {
      listeners.delete(onStoreChange);
      window.removeEventListener("storage", onStorage);
    };
  },
};
