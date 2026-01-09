import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { match } from "ts-pattern";

import { ENV } from "@/configs/env";

const api = axios.create({
  baseURL: ENV.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = "TODO"; // How do we handle auth tokens?
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
