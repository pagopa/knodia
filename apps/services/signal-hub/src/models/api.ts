import z from "zod";

export const API_SignalType = z.enum([
  "CREATE",
  "UPDATE",
  "DELETE",
  "SEEDUPDATE",
]);
export type API_SignalType = z.infer<typeof API_SignalType>;

export const API_ObjectSignalType = z.enum(["CREATE", "UPDATE", "DELETE"]);
export type API_ObjectSignalType = z.infer<typeof API_ObjectSignalType>;

const API_SignalBase = z.strictObject({
  eserviceId: z.uuid(),
  signalId: z.int().positive().meta({ format: "int64" }),
});

// Create/Update/Delete carry a pseudonymized object (objectId/objectType); SeedUpdate has none.
const API_ObjectSignal = API_SignalBase.extend({
  objectId: z.string(),
  objectType: z.string(),
  signalType: API_ObjectSignalType,
}).meta({ id: "ObjectSignal" });

const API_SeedUpdateSignal = API_SignalBase.extend({
  signalType: z.literal(API_SignalType.enum.SEEDUPDATE),
}).meta({ id: "SeedUpdateSignal" });

export const API_Signal = z
  .discriminatedUnion("signalType", [API_ObjectSignal, API_SeedUpdateSignal])
  .meta({ id: "Signal" });
export type API_Signal = z.infer<typeof API_Signal>;

export const API_PushResponse = z
  .strictObject({
    signalId: z.int().positive().meta({ format: "int64" }),
  })
  .meta({ id: "PushResponse" });
export type API_PushResponse = z.infer<typeof API_PushResponse>;

export const API_PullResponse = z
  .strictObject({
    lastSignalId: z.int().positive().meta({ format: "int64" }).optional(),
    signals: z.array(API_Signal),
  })
  .meta({ id: "PullResponse" });
export type API_PullResponse = z.infer<typeof API_PullResponse>;

export const API_PullSignalsQueryParams = z.strictObject({
  lastSignalId: z.coerce.number().int().min(0).default(0).meta({
    description: "The ID of the last signal received, used for pagination",
    format: "int64",
  }),
  size: z.coerce.number().int().min(1).max(100).default(10).meta({
    description: "Maximum number of signals returned",
    format: "int32",
  }),
});
export type API_PullSignalsQueryParams = z.infer<
  typeof API_PullSignalsQueryParams
>;
