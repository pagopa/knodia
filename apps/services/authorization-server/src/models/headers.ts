import z from "zod";

const DPOP_PROOF_HEADER = "dpop";

export const DPoPHeader = z.looseObject({
  [DPOP_PROOF_HEADER]: z
    .string()
    .refine((v) => !v.includes(","), "Only a single DPoP proof is allowed")
    .optional()
    .meta({ description: "DPoP proof JWT" }),
});
