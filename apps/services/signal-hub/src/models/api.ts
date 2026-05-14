import { EserviceId } from "@knodia/common-models/ids";
import z from "zod";

export const API_SignalType = z.enum([
  "CREATE",
  "UPDATE",
  "DELETE",
  "SEEDUPDATE",
]);
export type API_SignalType = z.infer<typeof API_SignalType>;

export const API_SignalSeed = z.strictObject({
  eserviceId: EserviceId,
  objectId: z.string(),
  objectType: z.string(),
  signalId: z.number().int().positive().meta({ format: "int64" }),
  signalType: API_SignalType,
});
export type API_SignalSeed = z.infer<typeof API_SignalSeed>;
