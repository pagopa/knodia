import z from "zod";

const API_SignalType = z
  .enum(["CREATE", "UPDATE", "DELETE", "SEEDUPDATE"])
  .meta({ id: "SignalType" });

export const API_PushSeed = z
  .strictObject({
    eserviceId: z.uuid(),
    objectId: z.string(),
    objectType: z.string(),
    signalId: z.int().positive().meta({ format: "int32" }),
    signalType: API_SignalType,
  })
  .meta({ id: "PushSeed" });
export type API_PushSeed = z.infer<typeof API_PushSeed>;

export const API_PushResponse = z
  .strictObject({
    signalId: z.int().positive().meta({ format: "int32" }),
  })
  .meta({ id: "PushResponse" });
export type API_PushResponse = z.infer<typeof API_PushResponse>;
