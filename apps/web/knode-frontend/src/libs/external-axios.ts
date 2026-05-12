import { createBffApiClient } from "@knodia/bff-client";
import axios, { type InternalAxiosRequestConfig, isAxiosError } from "axios";

import { config } from "@/config/config";
import {
  clearExternalToken,
  getExternalToken,
  redirectToExternalSessionLanding,
} from "@/libs/external-auth";

// Kept separate from the global `client` in `libs/axios.ts` so the two
// sessions never see each other's tokens, and so that 401 handling here does
// not redirect to the regular Cognito logout.
const externalAxios = axios.create();

function addExternalAuthHeader(axiosConfig: InternalAxiosRequestConfig) {
  const token = getExternalToken();
  if (token) {
    axiosConfig.headers.Authorization = `Bearer ${token}`;
  }
  return axiosConfig;
}

// 401 on the magic-link exchange means an invalid/expired one-shot token
// (rendered inline on landing), not a session expiry.
const externalAuthMintUrl = "/auth/externalUiSession";

function handleUnauthorized(error: unknown): Promise<unknown> {
  if (
    !isAxiosError(error) ||
    error.response?.status !== 401 ||
    error.config?.url?.includes(externalAuthMintUrl)
  ) {
    return Promise.reject(error);
  }
  clearExternalToken();
  // Hard reload to drop the React Query cache from the expired session.
  redirectToExternalSessionLanding();
  return Promise.reject(error);
}

externalAxios.interceptors.request.use(addExternalAuthHeader);
externalAxios.interceptors.response.use(
  (response) => response,
  handleUnauthorized,
);

export const externalClient = createBffApiClient({
  axios: externalAxios,
  baseURL: config.bffUrl,
});
