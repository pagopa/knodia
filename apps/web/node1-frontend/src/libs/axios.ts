import { createBffApiClient } from "@knodia/bff-client";
import axios, { type InternalAxiosRequestConfig, isAxiosError } from "axios";

import { config } from "@/config/config";
import {
  clearAllTokens,
  getAuthToken,
  getRefreshToken,
  redirectToLogout,
  setAuthToken,
  setRefreshToken,
} from "@/libs/auth";

let refreshPromise: null | Promise<boolean> = null;

const authUrls = ["/auth/ui-session", "/auth/ui-session/refresh"];

function addAuthHeader(axiosConfig: InternalAxiosRequestConfig) {
  const token = getAuthToken();
  if (token) {
    axiosConfig.headers.Authorization = `Bearer ${token}`;
  }
  return axiosConfig;
}

async function handleUnauthorized(error: unknown): Promise<unknown> {
  if (
    !isAxiosError(error) ||
    error.response?.status !== 401 ||
    !error.config ||
    authUrls.some((u) => error.config?.url?.endsWith(u))
  ) {
    return Promise.reject(error);
  }

  const refreshed = await refreshOnce();

  if (refreshed) {
    error.config.headers.Authorization = `Bearer ${getAuthToken()}`;
    return axios.request(error.config);
  }

  clearAllTokens();
  redirectToLogout();
  return Promise.reject(error);
}

function refreshOnce(): Promise<boolean> {
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

axios.interceptors.request.use(addAuthHeader);
axios.interceptors.response.use((response) => response, handleUnauthorized);

export const client = createBffApiClient({
  axios,
  baseURL: config.bffUrl,
  headers: {
    "Content-Type": "application/json",
  },
});
