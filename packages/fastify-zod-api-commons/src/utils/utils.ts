import type { IDS, KnodeId } from "@knodia/common-models/ids";

import {
  type ExternalId,
  unsafeBrandExternalId,
} from "@knodia/common-models/externalResource";

import { genericError } from "../models/errors/errors.ts";

type KnodeEntityMap<TEntity> = Map<KnodeId, Map<ExternalId<IDS>, TEntity>>;

export function assertEntityExists<TEntity>(
  entity: TEntity | undefined,
  message: string,
): TEntity {
  if (entity === undefined) {
    throw genericError(message);
  }
  return entity;
}

export async function getExternalEntitiesMap<
  TItem,
  TEntity extends { id: string },
>({
  fetchFn,
  getEntityId,
  getKnodeId,
  items,
}: {
  fetchFn: (args: {
    entityIds: ExternalId<IDS>[];
    knodeId: KnodeId;
  }) => Promise<TEntity[]>;
  getEntityId: (item: TItem) => string;
  getKnodeId: ((item: TItem) => KnodeId) | KnodeId;
  items: TItem[];
}): Promise<Map<KnodeId, Map<ExternalId<IDS>, TEntity>>> {
  const idsByKnode = new Map<KnodeId, Set<ExternalId<IDS>>>();
  for (const item of items) {
    const entityId = unsafeBrandExternalId<IDS>(getEntityId(item));
    const knodeId =
      typeof getKnodeId === "function" ? getKnodeId(item) : getKnodeId;

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
