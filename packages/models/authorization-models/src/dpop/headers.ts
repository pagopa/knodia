import z from "zod";

const DPOP_PROOF_HEADER = "dpop";

export const DpopHeader = z.strictObject({
  [DPOP_PROOF_HEADER]: z
    .string()
    .refine((v) => !v.includes(","), "Only a single DPoP proof is allowed")
    .meta({ description: "DPoP proof JWT" }),
});
