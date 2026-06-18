import { KnodeId } from "@knodia/common-models/ids";
import { describe, expect, it, vi } from "vitest";

import { getExternalEntitiesMap } from "../../src/utils/utils.ts";

const knodeId = KnodeId.parse("Orion");

const idA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const idB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

describe("getExternalEntitiesMap", () => {
  it("dedupes entity ids, fetches once, and returns a flat map keyed by entity id", async () => {
    const fetchFn = vi.fn(
      async ({ entityIds }: { entityIds: string[]; knodeId: typeof knodeId }) =>
        entityIds.map((id) => ({ id, name: `entity-${id}` })),
    );

    const result = await getExternalEntitiesMap({
      fetchFn,
      getEntityId: (item: { ref: string }) => item.ref,
      items: [{ ref: idA }, { ref: idA }, { ref: idB }],
      knodeId,
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn).toHaveBeenCalledWith({ entityIds: [idA, idB], knodeId });
    expect(Array.from(result.values())).toEqual([
      { id: idA, name: `entity-${idA}` },
      { id: idB, name: `entity-${idB}` },
    ]);
  });

  it("returns an empty map without calling fetchFn when items is empty", async () => {
    const fetchFn = vi.fn(async () => []);

    const result = await getExternalEntitiesMap({
      fetchFn,
      getEntityId: (item: { ref: string }) => item.ref,
      items: [] as { ref: string }[],
      knodeId,
    });

    expect(fetchFn).not.toHaveBeenCalled();
    expect(result.size).toBe(0);
  });
});
