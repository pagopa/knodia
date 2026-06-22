import { BaseJwtClaims } from "@knodia/common-models/auth";
import { CORRELATION_ID_HEADER } from "@knodia/common-models/headers";
import { ConsumerKeychainId } from "@knodia/common-models/ids";
import z from "zod";

export interface KnodiaJwtSignature {
  header: string; // base64url-encoded header
  payload: KnodiaJwtSignatureClaims;
  serialized: string; // full JWT string (header.payload.signature)
}

export const KNODIA_JWT_SIGNATURE_HEADER = "knodia-jwt-signature";
export const DIGEST_HEADER = "digest";
export const CONTENT_TYPE_HEADER = "content-type";
export const CONTENT_ENCODING_HEADER = "content-encoding";

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

export const KnodiaJwtSignatureClaims = BaseJwtClaims.extend({
  client_id: ConsumerKeychainId.optional(),
  signed_headers: KnodiaJwtSignatureSignedHeaders,
});
export type KnodiaJwtSignatureClaims = z.infer<typeof KnodiaJwtSignatureClaims>;
