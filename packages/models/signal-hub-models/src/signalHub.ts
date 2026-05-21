import { EserviceId } from "@knodia/common-models/ids";
import { z } from "zod";

export const SignalType = z.enum(["Create", "Update", "Delete", "SeedUpdate"]);
export type SignalType = z.infer<typeof SignalType>;

export const Signal = z.strictObject({
  createdAt: z.coerce.date(),
  eserviceId: EserviceId,
  objectId: z.string(),
  objectType: z.string(),
  signalId: z.int().positive(),
  signalType: SignalType,
});
export type Signal = z.infer<typeof Signal>;
