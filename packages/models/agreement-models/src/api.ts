import z from "zod";

export const API_AgreementState = z
  .enum(["Active", "Suspended", "Archived"])
  .meta({ id: "AgreementState" });
export type API_AgreementState = z.infer<typeof API_AgreementState>;

export const API_AgreementConsumer = z
  .strictObject({
    id: z.uuid(),
    knodeId: z.enum(["Orion", "Lynx"]),
  })
  .meta({ id: "AgreementConsumer" });

export const API_AgreementAttribute = z
  .strictObject({
    code: z.string(),
    scheme: z.string(),
  })
  .meta({ id: "AgreementAttribute" });
export type API_AgreementAttribute = z.infer<typeof API_AgreementAttribute>;
