import { KnodeId } from "@knodia/common-models/ids";

/**
 * Derives the single knode of a single-knode listing from its results, or
 * undefined when the listing is empty. Cross-knode listings are single-knode
 * (KN-589), so every result shares one knode — taking it from the first is safe.
 */
export function singleListingKnodeId<T>(
  results: T[],
  getKnodeId: (result: T) => string,
): KnodeId | undefined {
  const first = results.at(0);
  return first === undefined ? undefined : KnodeId.parse(getKnodeId(first));
}
