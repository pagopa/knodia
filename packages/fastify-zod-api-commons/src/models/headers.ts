import z from "zod";

import { API_CorrelationId } from "./api.ts";

export const CORRELATION_ID_HEADER = "x-correlation-id";
export const AUTHORIZATION_HEADER = "authorization";

export const KnodiaServiceHeaders = z.looseObject({
  [CORRELATION_ID_HEADER]: API_CorrelationId.meta({
    description: "Unique identifier of the request",
  }),
  // Note: Authorization header is not defined here since we don't want
  // the openapi generation to include it in the schema of every endpoint,
  // as we use securitySchemes for that.
});
