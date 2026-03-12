import z from "zod";

import { type IDS, KnodeId } from "./brandedIds.ts";

export const ExternalId = <T extends IDS>() =>
  z
    .uuid()
    .brand<`ExternalId:${T extends string & z.core.$brand<infer B> ? B : never}`>();
export type ExternalId<T extends IDS> = z.infer<
  ReturnType<typeof ExternalId<T>>
>;

export const ExternalResource = <T extends IDS>() =>
  z.strictObject({
    id: ExternalId<T>(),
    knodeId: KnodeId,
  });
export type ExternalResource<T extends IDS> = z.infer<
  ReturnType<typeof ExternalResource<T>>
>;

export function generateExternalId<T extends IDS>(): ExternalId<T> {
  return crypto.randomUUID() as ExternalId<T>;
}

export function unsafeBrandExternalId<T extends IDS>(
  id: string,
): ExternalId<T> {
  return z.uuid().parse(id) as ExternalId<T>;
}
