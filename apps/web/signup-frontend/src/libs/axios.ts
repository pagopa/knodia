import { createSignupManagerApiClient } from "@knodia/signup-manager-client";
import axios, { type InternalAxiosRequestConfig, isAxiosError } from "axios";

import { config } from "@/config/config";

import { getStoredSessionToken, setStoredSessionToken } from "./auth";

const authUrls = ["/auth/oidc/token"];

function addAuthHeader(axiosConfig: InternalAxiosRequestConfig) {
  const token = getStoredSessionToken();
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

  setStoredSessionToken(null);
  window.location.assign("/login");

  return Promise.reject(error);
}

axios.interceptors.request.use(addAuthHeader);
axios.interceptors.response.use((response) => response, handleUnauthorized);

export const client = createSignupManagerApiClient({
  axios,
  baseURL: config.signupManagerUrl,
});
