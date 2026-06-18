import { requestContext } from "@fastify/request-context";
import { unauthorizedError } from "@knodia/fastify-zod-api-commons/models";

import type { API_CompanyUid } from "../models/api.ts";

import {
  findLegalEntity,
  findLegalEntityAddress,
} from "../data/legalEntities.ts";
import {
  legalEntityAddressNotFound,
  legalEntityNotFound,
} from "../models/errors.ts";

export function retrieveAccessTokenClaims() {
  const claims = requestContext.get("accessTokenClaims");
  if (!claims) {
    throw unauthorizedError("Missing access token claims");
  }

  return claims;
}

export function retrieveLegalEntity(uid: API_CompanyUid) {
  const legalEntity = findLegalEntity(uid);
  if (!legalEntity) {
    throw legalEntityNotFound(uid);
  }

  return legalEntity;
}

export function retrieveLegalEntityAddress(uid: API_CompanyUid) {
  const legalEntityAddress = findLegalEntityAddress(uid);
  if (!legalEntityAddress) {
    throw legalEntityAddressNotFound(uid);
  }

  return legalEntityAddress;
}
