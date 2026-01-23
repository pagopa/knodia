import z from "zod";

import { API_CorrelationId } from "./api.ts";

export const CORRELATION_ID_HEADER = "x-correlation-id";

export const processHeaders = z.strictObject({
  [CORRELATION_ID_HEADER]: API_CorrelationId.describe(
    "Unique identifier of the request",
  ),
});
