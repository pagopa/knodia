import { KnodeId } from "@knodia/common-models/ids";
import { z } from "zod";

export const requestAgreementSearchSchema = z.object({
  eserviceId: z.string(),
  knodeId: KnodeId,
});
