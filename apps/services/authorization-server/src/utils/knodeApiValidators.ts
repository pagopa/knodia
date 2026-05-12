import type { KnodeApiKeychainId } from "@knodia/common-models/ids";
import type { FastifyBaseLogger } from "fastify";

import { EXPECTED_CLIENT_ASSERTION_TYP } from "@knodia/authorization-models/clientAssertion";
import { KnodeApiClientAssertion } from "@knodia/authorization-models/clientAssertion/knodeApi";
import { type Algorithm } from "@knodia/common-models/crypto";
import { createPublicKey, decodeBase64Pem } from "@knodia/crypto";
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

import {
  clientAssertionClaimsValidationError,
  clientAssertionExpired,
  invalidClientAssertionJWS,
  invalidClientAssertionSignature,
  knodeApiKeychainKnodeVerificationDataNotFound,
  publicKeyAlgNotMatchingClientAssertionAlg,
  unexpectedClientAssertionSignatureVerificationError,
  unexpectedKnodeApiKeychainKnodeVerificationDataRetrievalError,
} from "../models/errors.ts";

export async function verifyKnodeApiClientAssertionSignature(
  {
    clientAssertionJWS,
    knodeApiKeychainId,
  }: {
    clientAssertionJWS: string;
    knodeApiKeychainId: KnodeApiKeychainId;
  },
  clientAssertionAcceptedAudiences: string[],
  jwtClockToleranceSeconds: number,
  clientAssertionMaxTokenAgeSeconds: number,
  k2kGatewayClient: K2K2GatewayApiClient,
  logger: FastifyBaseLogger,
) {
  try {
    const protectedHeader = decodeProtectedHeader(clientAssertionJWS);
    const payload = decodeJwt(clientAssertionJWS);

    logger.info(
      `Verifying Knode API Client Assertion (JTI=${payload.jti}) signature for Knode API Keychain ${knodeApiKeychainId} with KID ${protectedHeader.kid} and algorithm ${protectedHeader.alg}`,
    );

    const {
      headers: { alg: clientAssertionAlg, kid },
      payload: { knodeId },
    } = KnodeApiClientAssertion.parse({
      headers: protectedHeader,
      payload,
    });

    const {
      data: { ownerId, publicKey },
    } = await k2kGatewayApi.getKnodeApiClientAssertionVerificationData({
      body: {
        keychainId: knodeApiKeychainId,
        kid,
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

    await jwtVerify(clientAssertionJWS, verificationKey, {
      algorithms: [publicKey.algorithm],
      audience: clientAssertionAcceptedAudiences,
      clockTolerance: jwtClockToleranceSeconds,
      issuer: knodeApiKeychainId,
      maxTokenAge: clientAssertionMaxTokenAgeSeconds,
      subject: knodeApiKeychainId,
      typ: EXPECTED_CLIENT_ASSERTION_TYP,
    });

    return {
      keychainKnodeId: knodeId,
      ownerId,
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
      .with(P.instanceOf(JWSInvalid), (e) =>
        invalidClientAssertionJWS(e.message),
      )
      .with(P.instanceOf(ApiError), (e) => e)
      .with(P.instanceOf(AxiosError), (e) => {
        if (e.status === 404) {
          return knodeApiKeychainKnodeVerificationDataNotFound();
        } else {
          return unexpectedKnodeApiKeychainKnodeVerificationDataRetrievalError(
            e,
          );
        }
      })
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
