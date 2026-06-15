import z from "zod";

// TODO: duplicate
const CORRELATION_ID_HEADER = "x-correlation-id";

export const KNODIA_JWT_SIGNATURE_HEADER = "Knodia-JWT-Signature";
export const DIGEST_HEADER = "Digest";
export const CONTENT_TYPE_HEADER = "Content-Type";
export const CONTENT_ENCODING_HEADER = "Content-Encoding";

const DigestHeader = z.strictObject({
  [DIGEST_HEADER]: z.string(),
});
type DigestHeader = z.infer<typeof DigestHeader>;

const ContentTypeHeader = z.strictObject({
  [CONTENT_TYPE_HEADER]: z.string(),
});
type ContentTypeHeader = z.infer<typeof ContentTypeHeader>;

const ContentEncodingHeader = z.strictObject({
  [CONTENT_ENCODING_HEADER]: z.string(),
});
type ContentEncodingHeader = z.infer<typeof ContentEncodingHeader>;

const CorrelationIdHeader = z.strictObject({
  [CORRELATION_ID_HEADER]: z.string(),
});
type CorrelationIdHeader = z.infer<typeof CorrelationIdHeader>;

const KnodiaJwtSignatureSignedHeader = z.union([
  DigestHeader,
  ContentTypeHeader,
  ContentEncodingHeader,
  CorrelationIdHeader,
]);
type KnodiaJwtSignatureSignedHeader = z.infer<
  typeof KnodiaJwtSignatureSignedHeader
>;

export const KnodiaJwtSignatureSignedHeaders = z.array(
  KnodiaJwtSignatureSignedHeader,
);
export type KnodiaJwtSignatureSignedHeaders = z.infer<
  typeof KnodiaJwtSignatureSignedHeaders
>;
