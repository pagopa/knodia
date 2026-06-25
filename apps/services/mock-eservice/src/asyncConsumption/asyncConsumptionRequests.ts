import {
  findLegalEntity,
  findLegalEntityAddress,
} from "../data/legalEntities.ts";
import {
  API_AsyncConsumptionRequestState,
  type API_CompanyUid,
  type API_GetCompanyAddressesResults,
} from "../models/api.ts";
import {
  asyncCompanyAddressesRequestNotFound,
  asyncCompanyAddressesResultsNotFound,
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
  API_GetCompanyAddressesResults["results"]
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

export function addAsyncCompanyAddressesResult(
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
      legalEntity,
      uidCompany,
    };
  });

  asyncCompanyAddressesResults.set(request.resourceId, results);
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
): API_AsyncConsumptionRequestState {
  // Once a request is completed it must remain completed, even if the system clock moves backwards.
  if (request.resourceId) {
    return API_AsyncConsumptionRequestState.enum.COMPLETED;
  }

  if (request.finishDate <= new Date()) {
    request.resourceId = crypto.randomUUID();
    return API_AsyncConsumptionRequestState.enum.COMPLETED;
  }

  return API_AsyncConsumptionRequestState.enum.PENDING;
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

function getMockFinishDate(requestId: string): Date {
  // UUIDs always end in a hex char (0-9, a-f); parse it as base 16 for a
  // 0-15 offset, giving a finish time 60-75 seconds from now.
  const offsetSeconds = 60 + parseInt(requestId.slice(-1), 16);
  return new Date(Date.now() + offsetSeconds * 1000);
}
