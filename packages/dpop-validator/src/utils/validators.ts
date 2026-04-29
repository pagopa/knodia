import type { JtiReplayStore } from "@knodia/db-jti-replay-store";
import type { FastifyBaseLogger } from "fastify";

import {
  DpopProof,
  EXPECTED_DPOP_PROOF_TYP,
} from "@knodia/authorization-models/dpop";
import { ApiError } from "@knodia/fastify-zod-api-commons/models";
import { decodeJwt, decodeProtectedHeader, importJWK, jwtVerify } from "jose";
import {
  JWSInvalid,
  JWSSignatureVerificationFailed,
  JWTClaimValidationFailed,
  JWTExpired,
} from "jose/errors";
import { match, P } from "ts-pattern";
import { ZodError } from "zod";

import {
  dpopClaimsValidationError,
  dpopProofAlreadyUsed,
  dpopProofExpired,
  invalidDpopProofJWS,
  invalidDpopProofSignature,
  unexpectedDpopProofSignatureVerificationError,
} from "../models/errors.ts";

interface VerifyDpopProofSignatureOptions {
  expectedHtm: string;
  expectedHtu: string;
  maxTokenAgeSeconds: number;
}

export async function assertDpopProofNotReplayed(
  dpopProofJWT: DpopProof,
  dpopProofMaxTokenAgeSeconds: number,
  dpopProofStore: JtiReplayStore,
) {
  const firstUse = await dpopProofStore.consume(
    dpopProofJWT.payload.jti,
    dpopProofJWT.payload.iat,
    dpopProofJWT.payload.iat + dpopProofMaxTokenAgeSeconds,
  );
  if (!firstUse) {
    throw dpopProofAlreadyUsed();
  }
}

export async function verifyDpopProofSignature(
  dpopProofJWS: string,
  options: VerifyDpopProofSignatureOptions,
  logger: FastifyBaseLogger,
): Promise<DpopProof>;
export async function verifyDpopProofSignature(
  dpopProofJWS: string | undefined,
  options: VerifyDpopProofSignatureOptions,
  logger: FastifyBaseLogger,
): Promise<DpopProof | undefined>;
export async function verifyDpopProofSignature(
  dpopProofJWS: string | undefined,
  {
    expectedHtm,
    expectedHtu,
    maxTokenAgeSeconds,
  }: VerifyDpopProofSignatureOptions,
  logger: FastifyBaseLogger,
): Promise<DpopProof | undefined> {
  if (!dpopProofJWS) {
    return undefined;
  }

  try {
    const protectedHeader = decodeProtectedHeader(dpopProofJWS);
    const payload = decodeJwt(dpopProofJWS);

    logger?.info(
      `Verifying DPoP Proof (JTI=${payload.jti}) signature with algorithm ${protectedHeader.alg}`,
    );

    const dpopProof = DpopProof(expectedHtm).parse({
      headers: protectedHeader,
      payload,
    });
    const {
      headers: { alg: dpopProofAlg, jwk },
      payload: { htu },
    } = dpopProof;

    assertDpopProofHtuIsValid(htu, expectedHtu);

    const verificationKey = await importJWK(jwk, dpopProofAlg);

    await jwtVerify(dpopProofJWS, verificationKey, {
      algorithms: [dpopProofAlg],
      maxTokenAge: maxTokenAgeSeconds,
      typ: EXPECTED_DPOP_PROOF_TYP,
    });

    return dpopProof;
  } catch (error) {
    throw match(error)
      .with(P.instanceOf(JWTExpired), () => dpopProofExpired())
      .with(
        P.union(P.instanceOf(JWTClaimValidationFailed), P.instanceOf(ZodError)),
        (e) => dpopClaimsValidationError(e),
      )
      .with(P.instanceOf(JWSSignatureVerificationFailed), () =>
        invalidDpopProofSignature(),
      )
      .with(P.instanceOf(JWSInvalid), (e) => invalidDpopProofJWS(e.message))
      .with(P.instanceOf(ApiError), (e) => e)
      .otherwise((e) => unexpectedDpopProofSignatureVerificationError(e));
  }
}

function assertDpopProofHtuIsValid(htu: string, expectedHtu: string) {
  const normalizeHtu = (raw: string) => {
    const url = new URL(raw);
    return `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, "")}`;
  };

  const errorMessage = `Invalid 'htu' claim in DPoP proof. Expected '${expectedHtu}' but got '${htu}'`;
  let normalizedHtu: string;
  let normalizedExpectedHtu: string;
  try {
    normalizedHtu = normalizeHtu(htu);
    normalizedExpectedHtu = normalizeHtu(expectedHtu);
  } catch (e) {
    throw dpopClaimsValidationError(
      new Error(e instanceof Error ? e.message : errorMessage),
    );
  }

  if (normalizedHtu !== normalizedExpectedHtu)
    throw dpopClaimsValidationError(new Error(errorMessage));
}
