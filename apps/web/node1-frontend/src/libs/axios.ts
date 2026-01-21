import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { match } from "ts-pattern";

import { config } from "@/config/config";

const api = axios.create({
  baseURL: config.bffUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // TODO: How do we handle auth tokens?
  const token = undefined;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    match(error.response?.status)
      .with(401, () => {
        // Do something when unauthorized, e.g., redirect to login
      })
      .otherwise(() => {
        // ... other error handling
      });
    return Promise.reject(error);
  },
);

export { api };
