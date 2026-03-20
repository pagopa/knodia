import type { IDS } from "@knodia/common-models/ids";
import type { API_KnodeId } from "@knodia/common-models/internalApi";

import {
  type ExternalId,
  unsafeBrandExternalId,
} from "@knodia/common-models/externalResource";

type KnodeEntityMap<TEntity> = Map<API_KnodeId, Map<string, TEntity>>;

export async function fetchEntities<TItem, TEntity extends { id: string }>({
  fetchFn,
  getEntityId,
  getKnodeId,
  items,
}: {
  fetchFn: (args: {
    entityIds: ExternalId<IDS>[];
    knodeId: API_KnodeId;
  }) => Promise<TEntity[]>;
  getEntityId: (item: TItem) => string;
  getKnodeId: (item: TItem) => API_KnodeId;
  items: TItem[];
}): Promise<Map<API_KnodeId, Map<string, TEntity>>> {
  const idsByKnode = new Map<API_KnodeId, Set<ExternalId<IDS>>>();
  for (const item of items) {
    const knodeId = getKnodeId(item);
    const entityId = unsafeBrandExternalId<IDS>(getEntityId(item));

    const set = idsByKnode.get(knodeId) ?? new Set<ExternalId<IDS>>();
    set.add(entityId);
    idsByKnode.set(knodeId, set);
  }

  const entitiesMap: KnodeEntityMap<TEntity> = new Map();
  await Promise.all(
    Array.from(idsByKnode.entries()).map(async ([knodeId, entityIds]) => {
      const entities = await fetchFn({
        entityIds: Array.from(entityIds),
        knodeId,
      });

      const entitiesByKnode =
        entitiesMap.get(knodeId) ?? new Map<ExternalId<IDS>, TEntity>();
      if (!entitiesMap.has(knodeId)) {
        entitiesMap.set(knodeId, entitiesByKnode);
      }

      entities.forEach((entity) => {
        entitiesByKnode.set(unsafeBrandExternalId(entity.id), entity);
      });
    }),
  );

  return entitiesMap;
}
