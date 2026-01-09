import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { match } from "ts-pattern";

const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "";

const api = axios.create({
  baseURL: API_BASE_URL,
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
