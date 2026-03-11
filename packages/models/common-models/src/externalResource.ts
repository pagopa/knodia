import z from "zod";

import { type IDS, KnodeId } from "./brandedIds.ts";

export const ExternalId = <T extends IDS>() =>
  z.uuid().brand<`ExternalId:${T}`>();
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
