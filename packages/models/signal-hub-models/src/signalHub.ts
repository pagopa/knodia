import { EserviceId } from "@knodia/common-models/ids";
import { z } from "zod";

export const SignalType = z.enum(["Create", "Update", "Delete", "SeedUpdate"]);
export type SignalType = z.infer<typeof SignalType>;

export const ObjectSignalType = z.enum(["Create", "Update", "Delete"]);
export type ObjectSignalType = z.infer<typeof ObjectSignalType>;

const SignalBase = z.strictObject({
  createdAt: z.coerce.date(),
  eserviceId: EserviceId,
  signalId: z.int().positive(),
});

// Create/Update/Delete carry a pseudonymized object (objectId/objectType); SeedUpdate has none.
const ObjectSignal = SignalBase.extend({
  objectId: z.string(),
  objectType: z.string(),
  signalType: ObjectSignalType,
});

const SeedUpdateSignal = SignalBase.extend({
  signalType: z.literal(SignalType.enum.SeedUpdate),
});

export const Signal = z.discriminatedUnion("signalType", [
  ObjectSignal,
  SeedUpdateSignal,
]);
export type Signal = z.infer<typeof Signal>;

// A signal ready to be pushed: same shape as Signal minus the server-assigned createdAt.
export const SignalSeed = z.discriminatedUnion("signalType", [
  ObjectSignal.omit({ createdAt: true }),
  SeedUpdateSignal.omit({ createdAt: true }),
]);
export type SignalSeed = z.infer<typeof SignalSeed>;
