import type { FastifyReply } from "fastify";

import z from "zod";

import { API_CorrelationId } from "./api.ts";

export const CORRELATION_ID_HEADER = "x-correlation-id";
const METADATA_VERSION_HEADER = "x-metadata-version";

export const processHeaders = z.looseObject({
  [CORRELATION_ID_HEADER]: API_CorrelationId.describe(
    "Unique identifier of the request",
  ),
});

export function setMetadataVersionHeader(
  res: FastifyReply,
  metadata: { version: number },
): void {
  res.header(METADATA_VERSION_HEADER, metadata.version.toString());
}
