import z from "zod";

const API_SignalType = z
  .enum(["CREATE", "UPDATE", "DELETE", "SEEDUPDATE"])
  .meta({ id: "SignalType" });

// TODO: check if this is correct for Knodia. Copied from signal-hub-core
export const API_PushSeed = z
  .strictObject({
    eserviceId: z.uuid(),
    objectId: z.string(),
    objectType: z.string(),
    signalId: z.number(),
    signalType: API_SignalType,
  })
  .meta({ id: "PushSeed" });
export type API_PushSeed = z.infer<typeof API_PushSeed>;
