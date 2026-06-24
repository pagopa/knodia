import { asyncCompanyAddressesRequestNotFound } from "../models/errors.ts";

export interface AsyncCompanyAddressesRequest {
  companyUids: API_CompanyUid[];
  finishDate: Date;
  id: string;
  resourceId?: string;
}

// Demo-only: async-consumption request IDs are kept in-memory and reset on
// process restart. Next endpoints in this flow read this cache.
const asyncCompanyAddressesRequests = new Map<
  string,
  AsyncCompanyAddressesRequest
>();

const asyncCompanyAddressesResults = new Map<
  string,
  {
    address?: API_Address;
    legalEntity?: API_LegalEntity;
    uidCompany: API_CompanyUid;
  }[]
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

export function getAsyncCompanyAddressesRequestStatus(
export function getAsyncCompanyAddressesRequest(
  requestId: string,
): AsyncCompanyAddressesRequest {
  const request = asyncCompanyAddressesRequests.get(requestId);

  if (request === undefined) {
    throw asyncCompanyAddressesRequestNotFound(requestId);
  }

  return request;
}

export function hasAsyncCompanyAddressesRequest(requestId: string): boolean {
  return asyncCompanyAddressesRequests.has(requestId);
}

export function resetAsyncCompanyAddressesRequests(): void {
  asyncCompanyAddressesRequests.clear();
}

function getMockFinishDate(requestId: string): Date {
  // UUIDs always end in a hex char (0-9, a-f); parse it as base 16 for a
  // 0-15 offset, giving a finish time 60-75 seconds from now.
  const offsetSeconds = 60 + parseInt(requestId.slice(-1), 16);
  return new Date(Date.now() + offsetSeconds * 1000);
}
