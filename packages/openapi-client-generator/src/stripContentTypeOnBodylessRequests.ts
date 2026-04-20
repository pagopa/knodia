import type { AxiosInstance } from "axios";

// Axios defaults Content-Type to application/x-www-form-urlencoded on POST/PUT/PATCH.
// For bodyless requests this causes Fastify to reject with
// 415 when no form-urlencoded parser is registered.
// Strip the header only on those methods when the request carries no body,
// leaving real payloads and non-mutating methods untouched.
export const stripContentTypeOnBodylessRequests = (
  instance: AxiosInstance,
): void => {
  instance.interceptors.request.use((config) => {
    const method = config.method?.toLowerCase();
    const isMutatingMethod =
      method === "post" || method === "put" || method === "patch";
    const hasNoBody = config.data === undefined || config.data === null;
    if (isMutatingMethod && hasNoBody) {
      // Set to null (not delete) so axios's dispatchRequest doesn't re-add the
      // form-urlencoded fallback. Null header values are stripped from the wire
      // by AxiosHeaders.toJSON() just before transport.
      config.headers.set("Content-Type", null, true);
    }
    return config;
  });
};
