import type { FastifyBaseLogger } from "fastify";

import { type Algorithm } from "@knodia/common-models/algorithms";
import {
  createPublicKey,
  decodeBase64Pem,
} from "@knodia/fastify-zod-api-commons/crypto";
import { ApiError } from "@knodia/fastify-zod-api-commons/models";
import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";
import { AxiosError } from "axios";
import { decodeJwt, decodeProtectedHeader, jwtVerify } from "jose";
import {
  JWSInvalid,
  JWSSignatureVerificationFailed,
  JWTClaimValidationFailed,
  JWTExpired,
} from "jose/errors";
import { match, P } from "ts-pattern";
import { ZodError } from "zod";

import type { API_TokenRequest } from "../models/api.ts";

import { ClientAssertion } from "../models/clientAssertion.ts";
import {
  clientAssertionClaimsValidationError,
  clientAssertionExpired,
  invalidClientAssertionSignature,
  jsonWebTokenError,
  publicKeyAlgNotMatchingClientAssertionAlg,
  unexpectedClientAssertionSignatureVerificationError,
} from "../models/errors.ts";

export async function verifyClientAssertionSignature(
  {
    client_assertion: clientAssertionJws,
    client_id: consumerKeychainId,
  }: API_TokenRequest,
  clientAssertionAcceptedAudiences: string[],
  clientAssertionClockToleranceSeconds: number,
  clientAssertionMaxTokenAgeSeconds: number,
  k2kGatewayClient: K2K2GatewayApiClient,
  logger: FastifyBaseLogger,
) {
  try {
    const protectedHeader = decodeProtectedHeader(clientAssertionJws);
    const payload = decodeJwt(clientAssertionJws);

    logger.info(
      `Verifying Client Assertion (JTI=${payload.jti}) signature for Consumer Keychain ${consumerKeychainId} with KID ${protectedHeader.kid} and algorithm ${protectedHeader.alg}`,
    );

    const {
      header: { alg: clientAssertionAlg, kid },
      payload: { purposeId },
    } = ClientAssertion.parse({
      header: protectedHeader,
      payload,
    });

    const {
      data: { consumerAttributes, publicKey },
    } = await k2kGatewayApi.getClientAssertionVerificationData({
      body: {
        keychainId: consumerKeychainId,
        kid,
        purposeId,
      },
      client: k2kGatewayClient,
    });

    assertPublicKeyAlgEqualToClientAssertionAlg(
      publicKey.algorithm,
      clientAssertionAlg,
    );

    const verificationKey = createPublicKey({
      pemKey: decodeBase64Pem(publicKey.encodedPem),
    });

    await jwtVerify(clientAssertionJws, verificationKey, {
      algorithms: [publicKey.algorithm],
      audience: clientAssertionAcceptedAudiences,
      clockTolerance: clientAssertionClockToleranceSeconds,
      issuer: consumerKeychainId,
      maxTokenAge: clientAssertionMaxTokenAgeSeconds,
      subject: consumerKeychainId,
      typ: "JWT",
    });

    return {
      consumerAttributes,
      purposeId,
    };
  } catch (error) {
    throw match(error)
      .with(P.instanceOf(JWTExpired), () => clientAssertionExpired())
      .with(
        P.union(P.instanceOf(JWTClaimValidationFailed), P.instanceOf(ZodError)),
        (e) => clientAssertionClaimsValidationError(e),
      )
      .with(P.instanceOf(JWSSignatureVerificationFailed), () =>
        invalidClientAssertionSignature(),
      )
      .with(P.instanceOf(JWSInvalid), (e) => jsonWebTokenError(e.message))
      .with(P.union(P.instanceOf(ApiError), P.instanceOf(AxiosError)), (e) => e)
      .otherwise((e) => unexpectedClientAssertionSignatureVerificationError(e));
  }
}

function assertPublicKeyAlgEqualToClientAssertionAlg(
  publicKeyAlg: string,
  clientAssertionAlg: Algorithm,
) {
  if (publicKeyAlg !== clientAssertionAlg) {
    throw publicKeyAlgNotMatchingClientAssertionAlg(
      publicKeyAlg,
      clientAssertionAlg,
    );
  }
}
