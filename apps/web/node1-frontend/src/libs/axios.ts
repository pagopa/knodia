import { createBffApiClient } from "@knodia/bff-client";
import axios, { isAxiosError } from "axios";

import { config } from "@/config/config";
import {
  clearAllTokens,
  getAuthToken,
  getRefreshToken,
  redirectToLogout,
  setAuthToken,
  setRefreshToken,
} from "@/libs/auth";

axios.interceptors.request.use((axiosConfig) => {
  const token = getAuthToken();
  if (token) {
    axiosConfig.headers = axiosConfig.headers ?? {};
    axiosConfig.headers.Authorization = `Bearer ${token}`;
  }
  return axiosConfig;
});

let refreshPromise: null | Promise<boolean> = null;

function handleRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = tryRefreshToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const { data } = await axios.post<{
      refreshToken: string;
      uiSessionToken: string;
    }>(`${config.bffUrl}/auth/ui-session/refresh`, { refreshToken });

    setAuthToken(data.uiSessionToken);
    setRefreshToken(data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

axios.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (
      isAxiosError(error) &&
      error.response?.status === 401 &&
      error.config &&
      !error.config.url?.includes("/auth/ui-session")
    ) {
      const refreshed = await handleRefresh();

      if (refreshed) {
        error.config.headers.Authorization = `Bearer ${getAuthToken()}`;
        return axios.request(error.config);
      }

      clearAllTokens();
      redirectToLogout();
    }

    return Promise.reject(error);
  },
);

export const client = createBffApiClient({
  axios,
  baseURL: config.bffUrl,
  headers: {
    "Content-Type": "application/json",
  },
});
