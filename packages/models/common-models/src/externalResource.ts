import z from "zod";

import { ExternalId, type IDS, KnodeId } from "./brandedIds.ts";

export const ExternalResource = <T extends IDS>() =>
  z.strictObject({
    id: ExternalId<T>(),
    knodeId: KnodeId,
  });
export type ExternalResource<T extends IDS> = z.infer<
  ReturnType<typeof ExternalResource<T>>
>;
