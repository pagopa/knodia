import type { CorrelationId } from "@knodia/common-models/ids";
import type { FastifyReply, FastifyRequest } from "fastify";

import z from "zod";

import { API_CorrelationId } from "./api.ts";

export const CORRELATION_ID_HEADER = "x-correlation-id";
export const AUTHORIZATION_HEADER = "authorization";
export const METADATA_VERSION_HEADER = "metadata-version";

export const MetadataVersionHeader = z.object({
  [METADATA_VERSION_HEADER]: z.string().meta({
    description: "Metadata version of the resource",
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
export type KnodiaServiceHeaders = z.infer<typeof KnodiaServiceHeaders>;

export function setMetadataVersionHeader(
  res: FastifyReply,
  version: number,
): void {
  res.header(METADATA_VERSION_HEADER, version.toString());
}

export const getKnodiaServiceHeaders = (
  req: FastifyRequest,
  correlationId: CorrelationId,
) => ({
  [AUTHORIZATION_HEADER]: req.headers.authorization,
  [CORRELATION_ID_HEADER]: correlationId,
});
