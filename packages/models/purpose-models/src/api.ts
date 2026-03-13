import { PurposeId } from "@knodia/common-models/ids";
import z from "zod";

export const API_PurposeIdPathParam = z.strictObject({
  purposeId: PurposeId,
});
export type API_PurposeIdPathParam = z.infer<typeof API_PurposeIdPathParam>;
