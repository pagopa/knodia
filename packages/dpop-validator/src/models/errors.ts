import {
  type CommonErrorCodes,
  createApiError,
  createApiErrorFromErrorsList,
} from "@knodia/fastify-zod-api-commons/models";
import { constants } from "http2";
import { ZodError } from "zod";

const { HTTP_STATUS_INTERNAL_SERVER_ERROR, HTTP_STATUS_UNAUTHORIZED } =
  constants;

export type DpopErrorKey =
  | "DPOP_CLAIMS_VALIDATION_ERROR"
  | "DPOP_PROOF_ALREADY_USED"
  | "DPOP_PROOF_EXPIRED"
  | "INVALID_DPOP_PROOF_JWS"
  | "INVALID_DPOP_PROOF_SIGNATURE"
  | "UNEXPECTED_DPOP_PROOF_SIGNATURE_VERIFICATION_ERROR";

type DpopErrorCodes = CommonErrorCodes | DpopErrorKey;

export function dpopClaimsValidationError(error: unknown) {
  return createApiErrorFromErrorsList<DpopErrorCodes>({
    code: "DPOP_CLAIMS_VALIDATION_ERROR",
    errors:
      error instanceof ZodError
        ? error.issues
        : error instanceof Error
          ? [error]
          : [],
    status: HTTP_STATUS_UNAUTHORIZED,
    title: "invalid_dpop_proof",
  });
}

export function dpopProofAlreadyUsed(jti: string) {
  return createApiError<DpopErrorCodes>({
    code: "DPOP_PROOF_ALREADY_USED",
    detail: `DPoP proof with JTI=${jti} already used`,
    status: HTTP_STATUS_UNAUTHORIZED,
    title: "invalid_dpop_proof",
  });
}

export function dpopProofExpired() {
  return createApiError<DpopErrorCodes>({
    code: "DPOP_PROOF_EXPIRED",
    detail: "The DPoP Proof has expired",
    status: HTTP_STATUS_UNAUTHORIZED,
    title: "invalid_dpop_proof",
  });
}

export function invalidDpopProofJWS(message: string) {
  return createApiError<DpopErrorCodes>({
    code: "INVALID_DPOP_PROOF_JWS",
    detail: `Invalid JWT format in DPoP Proof signature verification. Reason: ${message}`,
    status: HTTP_STATUS_UNAUTHORIZED,
    title: "invalid_dpop_proof",
  });
}

export function invalidDpopProofSignature() {
  return createApiError<DpopErrorCodes>({
    code: "INVALID_DPOP_PROOF_SIGNATURE",
    detail: "The DPoP Proof signature is invalid",
    status: HTTP_STATUS_UNAUTHORIZED,
    title: "invalid_dpop_proof",
  });
}

export function unexpectedDpopProofSignatureVerificationError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";

  return createApiError<DpopErrorCodes>({
    code: "UNEXPECTED_DPOP_PROOF_SIGNATURE_VERIFICATION_ERROR",
    detail: `An unexpected error occurred during DPoP Proof signature verification: ${message}`,
    status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    title: "invalid_dpop_proof",
  });
}
