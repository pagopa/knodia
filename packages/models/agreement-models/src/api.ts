import { AgreementId } from "@knodia/common-models/ids";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import z from "zod";

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

export const API_AgreementIdPathParam = z.strictObject({
  agreementId: AgreementId,
});
export type API_AgreementIdPathParam = z.infer<typeof API_AgreementIdPathParam>;
