import type { IDS, KnodeId } from "@knodia/common-models/ids";

import {
  type ExternalId,
  unsafeBrandExternalId,
} from "@knodia/common-models/externalResource";

import { genericError } from "../models/errors/errors.ts";

export function assertEntityExists<TEntity>(
  entity: TEntity | undefined,
  message: string,
): TEntity {
  if (entity === undefined) {
    throw genericError(message);
  }
  return entity;
}

// Safe: `items` are paginated with the OpenAPI safe limit, and `fetchFn` receives only unique IDs from `items`.
// This ensures `entityIds.length` never exceeds the safe limit.
export async function getExternalEntitiesMap<
  TItem,
  TEntity extends { id: string },
>({
  fetchFn,
  getEntityId,
  items,
  knodeId,
}: {
  fetchFn: (args: {
    entityIds: ExternalId<IDS>[];
    knodeId: KnodeId;
  }) => Promise<TEntity[]>;
  getEntityId: (item: TItem) => string;
  items: TItem[];
  knodeId: KnodeId;
}): Promise<Map<ExternalId<IDS>, TEntity>> {
  const entityIds = new Set<ExternalId<IDS>>(
    items.map((item) => unsafeBrandExternalId<IDS>(getEntityId(item))),
  );
  if (entityIds.size === 0) {
    return new Map();
  }

  const entities = await fetchFn({ entityIds: Array.from(entityIds), knodeId });

  return new Map(
    entities.map((entity) => [unsafeBrandExternalId(entity.id), entity]),
  );
}
