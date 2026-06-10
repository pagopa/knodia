import type { KnodeId } from "@knodia/common-models/ids";

import { multiKnodeListingNotSupported } from "../models/errors.ts";

export function emptyListingPage<T>(
  limit: number,
  offset: number,
): {
  pagination: { limit: number; offset: number; total: number };
  results: T[];
} {
  return { pagination: { limit, offset, total: 0 }, results: [] };
}

// Provisional (KN-589): cross-knode listings target a single knode until
// cross-knode event propagation lands. Resolve the one knode to query, failing
// fast if the consumer's resources span more than one.
export function resolveSingleListingKnode(
  knodes: KnodeId[],
): KnodeId | undefined {
  if (knodes.length > 1) {
    throw multiKnodeListingNotSupported(knodes);
  }
  return knodes.at(0);
}
