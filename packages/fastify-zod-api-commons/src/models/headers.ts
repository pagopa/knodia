import type { FastifyReply } from "fastify";

import z from "zod";

import { API_CorrelationId } from "./api.ts";

export const CORRELATION_ID_HEADER = "x-correlation-id";
export const AUTHORIZATION_HEADER = "authorization";
export const METADATA_VERSION_HEADER = "x-metadata-version";

export const MetadataVersionHeader = z.object({
  [METADATA_VERSION_HEADER]: z.string().meta({
    description: "Metadata version of the relevant resource",
  }),
});

export const KnodiaServiceHeaders = z.looseObject({
  [CORRELATION_ID_HEADER]: API_CorrelationId.meta({
    description: "Unique identifier of the request",
  }),
  // Note: Authorization header is not defined here since we don't want
  // the openapi generation to include it in the schema of every endpoint,
  // as we use securitySchemes for that.
});

export function setMetadataVersionHeader(
  res: FastifyReply,
  version: number,
): void {
  res.header(METADATA_VERSION_HEADER, version.toString());
}
