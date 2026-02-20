import { createBffApiClient } from "@knodia/bff-client";
import axios, { isAxiosError } from "axios";
import { match } from "ts-pattern";

import { config } from "@/config/config";

axios.interceptors.request.use((axiosConfig) => {
  // TODO: Replace with real auth flow
  const token = config.sessionToken;
  if (token) {
    axiosConfig.headers = axiosConfig.headers ?? {};
    axiosConfig.headers.Authorization = `Bearer ${token}`;
  }
  return axiosConfig;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error)) {
      match(error.response?.status)
        .with(401, () => {
          // Do something when unauthorized, e.g., redirect to login
        })
        .otherwise(() => {
          // ... other error handling
        });
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
