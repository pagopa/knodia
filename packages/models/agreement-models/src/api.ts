import z from "zod";

const API_KnodeId = z
  .enum(["Orion", "Lynx"])
  .meta({ description: "Unique Knode identifier", id: "KnodeId" });

export const API_AgreementState = z
  .enum(["Active", "Suspended", "Archived"])
  .meta({ id: "AgreementState" });
export type API_AgreementState = z.infer<typeof API_AgreementState>;

export const API_AgreementConsumer = z
  .strictObject({
    id: z.uuid(),
    knodeId: API_KnodeId,
  })
  .meta({ id: "AgreementConsumer" });
export type API_AgreementConsumer = z.infer<typeof API_AgreementConsumer>;
