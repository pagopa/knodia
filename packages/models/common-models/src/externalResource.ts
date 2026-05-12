import z from "zod";

import { type IDS } from "./ids/brandedIds.ts";
import { KnodeId } from "./ids/ids.ts";

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

export function fromExternalResource<T extends IDS>(input: {
  id: string;
  knodeId: string;
}): ExternalResource<T> {
  return {
    id: unsafeBrandExternalId<T>(input.id),
    knodeId: KnodeId.parse(input.knodeId),
    // z.infer doesn't reduce in generic context: https://github.com/colinhacks/zod/issues/3309
  } as ExternalResource<T>;
}

export function fromOptionalExternalResource<T extends IDS>(input?: {
  id: string;
  knodeId: string;
}): ExternalResource<T> | undefined {
  if (!input) return undefined;
  return fromExternalResource<T>(input);
}

export function generateExternalId<T extends IDS>(): ExternalId<T> {
  return crypto.randomUUID() as ExternalId<T>;
}

export function toExternalResource<T extends IDS>(
  id: string,
  knodeId: string,
): ExternalResource<T> {
  return {
    id: unsafeBrandExternalId<T>(id),
    knodeId: KnodeId.parse(knodeId),
    // z.infer doesn't reduce in generic context: https://github.com/colinhacks/zod/issues/3309
  } as ExternalResource<T>;
}

export function toOptionalExternalResource<T extends IDS>(
  id: null | string,
  knodeId: null | string,
): ExternalResource<T> | undefined {
  if (!id || !knodeId) return undefined;
  return toExternalResource<T>(id, knodeId);
}

export function unsafeBrandExternalId<T extends IDS>(
  id: string,
): ExternalId<T> {
  return z.uuid().parse(id) as ExternalId<T>;
}
