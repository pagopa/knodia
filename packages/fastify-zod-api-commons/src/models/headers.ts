import z from "zod";

export const CORRELATION_ID_HEADER = "x-correlation-id";

export const processHeaders = z.object({
  [CORRELATION_ID_HEADER]: z.uuid(),
});
