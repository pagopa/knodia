import { bffApi, createBffApiClient } from "@knodia/bff-client";
import axios, { type InternalAxiosRequestConfig, isAxiosError } from "axios";

import { config } from "@/config/config";
import {
  clearAuthToken,
  getAuthToken,
  redirectToLogout,
  setAuthToken,
} from "@/libs/auth";

let refreshPromise: null | Promise<boolean> = null;

const authUrls = ["/auth/uiSession", "/auth/uiSession/refresh", "/auth/logout"];

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
    authUrls.some((u) => error.config?.url?.includes(u))
  ) {
    return Promise.reject(error);
  }

  const refreshed = await refreshOnce();

  if (refreshed) {
    error.config.headers.Authorization = `Bearer ${getAuthToken()}`;
    return axios.request(error.config);
  }

  clearAuthToken();
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
  try {
    const { data } = await bffApi.refreshSession({
      client,
      withCredentials: true,
    });

    setAuthToken(data.uiSessionToken);
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
});
