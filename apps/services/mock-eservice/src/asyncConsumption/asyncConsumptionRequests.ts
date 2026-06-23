import type { UUID } from "crypto";

import { asyncCompanyAddressesRequestNotFound } from "../models/errors.ts";

// Demo-only: async-consumption request IDs are kept in-memory and reset on
// process restart. Next endpoints in this flow read this cache.
const asyncCompanyAddressesRequests = new Map<UUID, Date>();

export function addAsyncCompanyAddressesRequest(requestId: UUID): void {
  asyncCompanyAddressesRequests.set(requestId, getMockFinishDate(requestId));
}

export function getAsyncCompanyAddressesRequestStatus(
  requestId: UUID,
): boolean {
  const request = asyncCompanyAddressesRequests.get(requestId);

  if (request === undefined) {
    throw asyncCompanyAddressesRequestNotFound(requestId);
  }

  return request <= new Date();
}

export function hasAsyncCompanyAddressesRequest(requestId: UUID): boolean {
  return asyncCompanyAddressesRequests.has(requestId);
}

export function resetAsyncCompanyAddressesRequests(): void {
  asyncCompanyAddressesRequests.clear();
}

function getMockFinishDate(requestId: UUID): Date {
  // UUIDs always end in a hex char (0-9, a-f); parse it as base 16 for a
  // 0-15 offset, giving a finish time 15-30 seconds from now.
  const offsetSeconds = 15 + parseInt(requestId.slice(-1), 16);
  return new Date(Date.now() + offsetSeconds * 1000);
}
