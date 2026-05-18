import z from "zod";

export const API_SignalType = z
  .enum(["CREATE", "UPDATE", "DELETE", "SEEDUPDATE"])
  .meta({ id: "SignalType" });
export type API_SignalType = z.infer<typeof API_SignalType>;

export const API_Signal = z
  .strictObject({
    eserviceId: z.uuid(),
    objectId: z.string(),
    objectType: z.string(),
    signalId: z.int().positive().meta({ format: "int32" }),
    signalType: API_SignalType,
  })
  .meta({ id: "Signal" });
export type API_Signal = z.infer<typeof API_Signal>;

export const API_PushSeed = API_Signal.meta({ id: "PushSeed" });
export type API_PushSeed = z.infer<typeof API_PushSeed>;

export const API_PushResponse = z
  .strictObject({
    signalId: z.int().positive().meta({ format: "int32" }),
  })
  .meta({ id: "PushResponse" });
export type API_PushResponse = z.infer<typeof API_PushResponse>;

export const API_PullResponse = z
  .strictObject({
    lastSignalId: z.int().positive().meta({ format: "int32" }).optional(),
    signals: z.array(API_Signal),
  })
  .meta({ id: "PullResponse" });
export type API_PullResponse = z.infer<typeof API_PullResponse>;

export const API_PullSignalsQueryParams = z.strictObject({
  limit: z.coerce.number().min(1).max(100).default(10).meta({
    description: "Maximum number of signals returned",
    format: "int32",
  }),
  signalId: z.coerce.number().min(0).default(0).meta({
    description: "The ID of the last signal received, used for pagination",
    format: "int32",
  }),
});
export type API_PullSignalsQueryParams = z.infer<
  typeof API_PullSignalsQueryParams
>;
