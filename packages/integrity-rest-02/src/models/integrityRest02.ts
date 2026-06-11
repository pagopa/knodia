import { CORRELATION_ID_HEADER } from "@knodia/fastify-zod-api-commons/models";
import z from "zod";

export const KNODIA_JWT_SIGNATURE_HEADER = "Knodia-JWT-Signature";
export const DIGEST_HEADER = "Digest";
export const CONTENT_TYPE_HEADER = "Content-Type";
export const CONTENT_ENCODING_HEADER = "Content-Encoding";

export const DigestHeader = z.strictObject({
  [DIGEST_HEADER.toLowerCase()]: z.string(),
});
export type DigestHeader = z.infer<typeof DigestHeader>;

export const ContentTypeHeader = z.strictObject({
  [CONTENT_TYPE_HEADER.toLowerCase()]: z.string(),
});
export type ContentTypeHeader = z.infer<typeof ContentTypeHeader>;

export const ContentEncodingHeader = z.strictObject({
  [CONTENT_ENCODING_HEADER.toLowerCase()]: z.string(),
});
export type ContentEncodingHeader = z.infer<typeof ContentEncodingHeader>;

export const CorrelationIdHeader = z.strictObject({
  [CORRELATION_ID_HEADER]: z.string(),
});
export type CorrelationIdHeader = z.infer<typeof CorrelationIdHeader>;

export const KnodiaJwtSignatureSignedHeader = z.union([
  DigestHeader,
  ContentTypeHeader,
  ContentEncodingHeader,
  CorrelationIdHeader,
]);
export type KnodiaJwtSignatureSignedHeader = z.infer<
  typeof KnodiaJwtSignatureSignedHeader
>;

export const KnodiaJwtSignatureSignedHeaders = z.array(
  KnodiaJwtSignatureSignedHeader,
);
export type KnodiaJwtSignatureSignedHeaders = z.infer<
  typeof KnodiaJwtSignatureSignedHeaders
>;
