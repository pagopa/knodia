import z from "zod";

export const API_Attribute = z
  .strictObject({
    code: z.string(),
    scheme: z.string(),
  })
  .meta({ id: "Attribute" });
export type API_Attribute = z.infer<typeof API_Attribute>;
