import { type DpopErrorKey } from "@knodia/dpop-validator/errors";
import { createApiError } from "@knodia/fastify-zod-api-commons/models";
import { makeApiProblemBuilder } from "@knodia/fastify-zod-api-commons/problemBuilder";

import type { API_CompanyUid } from "./api.ts";

/* eslint-disable perfectionist/sort-objects */
const errorCodes: Record<DpopErrorKey, string> & Record<string, string> = {
  DPOP_CLAIMS_VALIDATION_ERROR: "0001",
  DPOP_PROOF_EXPIRED: "0002",
  INVALID_DPOP_PROOF_JWS: "0003",
  INVALID_DPOP_PROOF_SIGNATURE: "0004",
  UNEXPECTED_DPOP_PROOF_SIGNATURE_VERIFICATION_ERROR: "0005",
  DPOP_PROOF_ALREADY_USED: "0006",
  DPOP_PROOF_NOT_FOUND: "0007",
  INVALID_DPOP_PROOF_JWS_FORMAT: "0008",
  INVALID_DPOP_PROOF_ATH: "0009",
  INVALID_DPOP_THUMBPRINT: "0010",
  NATURAL_PERSON_NOT_FOUND: "0011",
  RESIDENCE_NOT_AVAILABLE: "0012",
  LEGAL_ENTITY_NOT_FOUND: "0013",
  STUDENT_NOT_FOUND: "0014",
  LEGAL_ENTITY_ADDRESS_NOT_FOUND: "0015",
  ASYNC_COMPANY_ADDRESSES_REQUEST_NOT_FOUND: "0016",
};
/* eslint-enable perfectionist/sort-objects */

export const makeApiProblem = makeApiProblemBuilder(errorCodes, {
  forceGenericProblemOn500: true,
  serviceName: "mock-eservice",
});

export function asyncCompanyAddressesRequestNotFound(requestId: string) {
  return createApiError({
    code: "ASYNC_COMPANY_ADDRESSES_REQUEST_NOT_FOUND",
    detail: `No async company addresses request found for requestId ${requestId}`,
    status: 404,
    title: "async_company_addresses_request_not_found",
  });
}

export function dpopProofNotFound() {
  return createApiError({
    code: "DPOP_PROOF_NOT_FOUND",
    detail: "DPoP proof not found",
    status: 401,
    title: "invalid_dpop_proof",
  });
}

export function invalidDpopProofAth(
  dpopProofAth: string | undefined,
  expectedAth: string,
) {
  return createApiError({
    code: "INVALID_DPOP_PROOF_ATH",
    detail: `DPoP proof ath does not match the presented access token. Expected: ${expectedAth}, Received: ${dpopProofAth}`,
    status: 401,
    title: "invalid_dpop_proof",
  });
}

export function invalidDpopProofJwsFormat(dpopProofJws: string[]) {
  return createApiError({
    code: "INVALID_DPOP_PROOF_JWS_FORMAT",
    detail: `Invalid DPoP proof JWS format: ${dpopProofJws}. Expected a single string.`,
    status: 401,
    title: "invalid_dpop_proof",
  });
}

export function invalidDpopThumbprint(
  dpopProofThumbprint: string,
  expectedThumbprint: string,
) {
  return createApiError({
    code: "INVALID_DPOP_THUMBPRINT",
    detail: `DPoP proof thumbprint does not match the expected one. Expected: ${expectedThumbprint}, Received: ${dpopProofThumbprint}`,
    status: 401,
    title: "invalid_dpop_proof",
  });
}

export function legalEntityAddressNotFound(uidCompany: API_CompanyUid) {
  return createApiError({
    code: "LEGAL_ENTITY_ADDRESS_NOT_FOUND",
    detail: `No address found for legal entity with uid_company ${uidCompany}`,
    status: 404,
    title: "legal_entity_address_not_found",
  });
}

export function legalEntityNotFound(uidCompany: string) {
  return createApiError({
    code: "LEGAL_ENTITY_NOT_FOUND",
    detail: `No legal entity found for uid_company ${uidCompany}`,
    status: 404,
    title: "legal_entity_not_found",
  });
}

export function naturalPersonNotFound(notation: string) {
  return createApiError({
    code: "NATURAL_PERSON_NOT_FOUND",
    detail: `No natural person found for notation ${notation}`,
    status: 404,
    title: "natural_person_not_found",
  });
}

export function residenceNotAvailable(notation: string) {
  return createApiError({
    code: "RESIDENCE_NOT_AVAILABLE",
    detail: `No residence address found for natural person ${notation}`,
    status: 404,
    title: "residence_not_available",
  });
}

export function studentNotFound(uidStudent: string) {
  return createApiError({
    code: "STUDENT_NOT_FOUND",
    detail: `No student found for uidStudent ${uidStudent}`,
    status: 404,
    title: "student_not_found",
  });
}
