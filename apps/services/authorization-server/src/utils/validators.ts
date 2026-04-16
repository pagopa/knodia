import {
  createPublicKey,
  decodeBase64Pem,
} from "@knodia/fastify-zod-api-commons/crypto";
import {
  type K2K2GatewayApiClient,
  k2kGatewayApi,
} from "@knodia/k2k-gateway-client";
import { isAxiosError } from "axios";
import {
  decodeJwt,
  decodeProtectedHeader,
  type JWTPayload,
  jwtVerify,
} from "jose";
import {
  JWSInvalid,
  JWSSignatureVerificationFailed,
  JWTClaimValidationFailed,
  JWTExpired,
} from "jose/errors";
import { ZodError } from "zod";

import type { API_TokenRequest } from "../models/api.ts";

import { ClientAssertion } from "../models/clientAssertion.ts";
import {
  clientAssertionClaimsValidationError,
  clientAssertionExpired,
  invalidClientAssertionSignature,
  jsonWebTokenError,
  unexpectedClientAssertionSignatureVerificationError,
} from "../models/errors.ts";

export async function verifyClientAssertionSignature(
  {
    client_assertion: clientAssertionJws,
    client_id: clientId,
  }: API_TokenRequest,
  clientAssertionAcceptedAudiences: string[],
  clientAssertionClockToleranceSeconds: number,
  clientAssertionMaxTokenAgeSeconds: number,
  k2kGatewayClient: K2K2GatewayApiClient,
): Promise<JWTPayload> {
  try {
    const protectedHeader = decodeProtectedHeader(clientAssertionJws);
    const payload = decodeJwt(clientAssertionJws);

    const {
      header: { kid },
      payload: { purposeId },
    } = ClientAssertion.parse({
      header: protectedHeader,
      payload,
    });

    const {
      data: { consumerAttributes, publicKey },
    } = await k2kGatewayApi.getClientAssertionVerificationData({
      body: {
        keychainId: clientId,
        kid,
        purposeId,
      },
      client: k2kGatewayClient,
    });

    const verificationKey = createPublicKey({
      pemKey: decodeBase64Pem(publicKey.encodedPem),
    });

    await jwtVerify(clientAssertionJws, verificationKey, {
      algorithms: [publicKey.algorithm],
      audience: clientAssertionAcceptedAudiences,
      clockTolerance: clientAssertionClockToleranceSeconds,
      issuer: clientId,
      maxTokenAge: clientAssertionMaxTokenAgeSeconds,
      subject: clientId,
      typ: "JWT",
    });

    return {
      consumerAttributes,
      purposeId,
    };
  } catch (error) {
    if (error instanceof JWTExpired) {
      throw clientAssertionExpired();
    } else if (
      error instanceof JWTClaimValidationFailed ||
      error instanceof ZodError
    ) {
      throw clientAssertionClaimsValidationError(clientId, error);
    } else if (error instanceof JWSSignatureVerificationFailed) {
      throw invalidClientAssertionSignature();
    } else if (error instanceof JWSInvalid) {
      throw jsonWebTokenError(error.message);
    } else if (isAxiosError(error)) {
      throw error;
    } else {
      throw unexpectedClientAssertionSignatureVerificationError(error);
    }
  }
}
