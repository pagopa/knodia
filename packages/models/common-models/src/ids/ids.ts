import z from "zod";

export const KnodeId = z.enum(["Orion", "Lynx"]);
export type KnodeId = z.infer<typeof KnodeId>;
