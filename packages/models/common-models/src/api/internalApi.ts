import z from "zod";

export const API_KnodeId = z
  .enum(["Orion", "Lynx"])
  .meta({ description: "Unique Knode identifier", id: "KnodeId" });
export type API_KnodeId = z.infer<typeof API_KnodeId>;
