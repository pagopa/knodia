import type { ConsumerKeychainId } from "@knodia/common-models/ids";

import { KMSClient } from "@aws-sdk/client-kms";
import { CORRELATION_ID_HEADER } from "@knodia/common-models/headers";
import { dateToSeconds } from "@knodia/common-models/utils";
import { buildAndSignJwt } from "@knodia/crypto/utils";
import { randomUUID } from "crypto";

import {
  CONTENT_ENCODING_HEADER,
  CONTENT_TYPE_HEADER,
  DIGEST_HEADER,
  type KnodiaJwtSignature,
  type KnodiaJwtSignatureClaims,
  KnodiaJwtSignatureSignedHeaders,
} from "./models/integrityRest02.ts";

export type IntegrityRest02Generator = ReturnType<
  typeof integrityRest02GeneratorBuilder
>;

interface KnodiaJwtSignatureInput {
  clientId: ConsumerKeychainId | undefined;
  contentEncoding: number | string | string[] | undefined;
  contentType: number | string | string[] | undefined;
  correlationId: string;
  digest: string;
  issuer: string;
  kid: string;
  secondsDuration: number;
}

export function integrityRest02GeneratorBuilder(kmsClient?: KMSClient) {
  const client = kmsClient ?? new KMSClient();

  return {
    async generateKnodiaJwtSignature(
      input: KnodiaJwtSignatureInput,
    ): Promise<KnodiaJwtSignature> {
      const signedHeaders = KnodiaJwtSignatureSignedHeaders.parse([
        { [DIGEST_HEADER]: input.digest },
        { [CORRELATION_ID_HEADER]: input.correlationId },
        ...(input.contentType
          ? [{ [CONTENT_TYPE_HEADER]: String(input.contentType) }]
          : []),
        ...(input.contentEncoding
          ? [{ [CONTENT_ENCODING_HEADER]: String(input.contentEncoding) }]
          : []),
      ]);

      const currentTimestamp = dateToSeconds(new Date());

      const claims: KnodiaJwtSignatureClaims = {
        exp: currentTimestamp + input.secondsDuration,
        iat: currentTimestamp,
        iss: input.issuer,
        jti: randomUUID(),
        signed_headers: signedHeaders,
        ...(input.clientId ? { client_id: input.clientId } : {}),
      };

      const { header, serialized } = await buildAndSignJwt(
        client,
        input.kid,
        claims,
      );
      return {
        header,
        payload: claims,
        serialized,
      };
    },
  };
}
