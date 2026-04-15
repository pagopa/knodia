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

const authUrls = [
  "/auth/ui-session",
  "/auth/ui-session/refresh",
  "/auth/logout",
];

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

// Axios's default `headers.post/put/patch['Content-Type']` is
// `application/x-www-form-urlencoded`, which Fastify rejects with 415 since
// no parser is registered for it. Axios already adds the correct
// `application/json` Content-Type when a JSON body is present, so we clear
// the per-method defaults to avoid sending Content-Type on empty-body
// mutation requests (e.g. suspend/reactivate).
axios.defaults.headers.post["Content-Type"] = null;
axios.defaults.headers.put["Content-Type"] = null;
axios.defaults.headers.patch["Content-Type"] = null;

export const client = createBffApiClient({
  axios,
  baseURL: config.bffUrl,
});
