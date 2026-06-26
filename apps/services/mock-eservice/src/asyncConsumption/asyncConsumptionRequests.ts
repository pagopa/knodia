import { randomUUID } from "crypto";

import {
  findLegalEntity,
  findLegalEntityAddress,
} from "../data/legalEntities.ts";
import {
  API_AsyncConsumptionRequestState,
  type API_CompanyUid,
  type API_GetCompanyAddressesResult,
  type API_GetCompanyAddressesResults,
} from "../models/api.ts";
import {
  asyncCompanyAddressesRequestNotFound,
  asyncCompanyAddressesResultsNotFound,
  resourceIdDoesNotBelongToAsyncRequest,
} from "../models/errors.ts";

export interface AsyncCompanyAddressesRequest {
  companyUids: API_CompanyUid[];
  finishDate: Date;
  id: string;
  resourceId?: string;
}

// Demo-only: async-consumption request IDs are kept in-memory and reset on
// process restart. Next endpoints in this flow read this cache.
export const asyncCompanyAddressesRequests = new Map<
  string,
  AsyncCompanyAddressesRequest
>();

export const asyncCompanyAddressesResults = new Map<
  string,
  API_GetCompanyAddressesResult[]
>();

export function addAsyncCompanyAddressesRequest(
  requestId: string,
  companyUids: API_CompanyUid[],
): void {
  asyncCompanyAddressesRequests.set(requestId, {
    companyUids,
    finishDate: getMockFinishDate(requestId),
    id: requestId,
  });
}

export function assertResourceIdBelongsToRequest(
  request: AsyncCompanyAddressesRequest,
  resourceId: string,
): void {
  if (request.resourceId !== resourceId) {
    throw resourceIdDoesNotBelongToAsyncRequest(request.id, resourceId);
  }
}

export function getAsyncCompanyAddressesRequest(
  requestId: string,
): AsyncCompanyAddressesRequest {
  const request = asyncCompanyAddressesRequests.get(requestId);

  if (request === undefined) {
    throw asyncCompanyAddressesRequestNotFound(requestId);
  }

  return request;
}

export function getAsyncCompanyAddressesRequestState(
  request: AsyncCompanyAddressesRequest,
) {
  return request.resourceId
    ? API_AsyncConsumptionRequestState.enum.COMPLETED
    : API_AsyncConsumptionRequestState.enum.PENDING;
}

export function getAsyncCompanyAddressesResults(
  resourceId: string,
): API_GetCompanyAddressesResults {
  const results = asyncCompanyAddressesResults.get(resourceId);

  if (results === undefined) {
    throw asyncCompanyAddressesResultsNotFound(resourceId);
  }

  return { results };
}

export function resolveAsyncCompanyAddressesRequest(
  request: AsyncCompanyAddressesRequest,
) {
  if (!request.resourceId && request.finishDate <= new Date()) {
    request.resourceId = randomUUID();
    addAsyncCompanyAddressesResult(request);
  }
}

function addAsyncCompanyAddressesResult(
  request: AsyncCompanyAddressesRequest,
): void {
  if (!request.resourceId) {
    return;
  }

  const resources = asyncCompanyAddressesResults.get(request.resourceId);
  if (resources) {
    return;
  }

  const results = request.companyUids.map((uidCompany) => {
    const legalEntity = findLegalEntity(uidCompany);
    const address = findLegalEntityAddress(uidCompany);

    return {
      address,
      identifier: uidCompany,
      legalEntity,
    };
  });

  asyncCompanyAddressesResults.set(request.resourceId, results);
}

function getMockFinishDate(requestId: string): Date {
  // UUIDs always end in a hex char (0-9, a-f); parse it as base 16 for a
  // 0-15 offset, giving a finish time 60-75 seconds from now.
  const offsetSeconds = 60 + parseInt(requestId.slice(-1), 16);
  return new Date(Date.now() + offsetSeconds * 1000);
}
