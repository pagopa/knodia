import { PurposeId } from "@knodia/common-models/ids";
import z from "zod";

export const Purpose = z.strictObject({
  // TODO: add fields
  createdAt: z.coerce.date(),
  id: PurposeId,
  updatedAt: z.coerce.date(),
});
export type Purpose = z.infer<typeof Purpose>;
