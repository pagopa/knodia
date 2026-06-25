import z from "zod";

export const IntegrityRest02Config = z
  .object({
    INTEGRITY_REST_02_SIGNATURE_ISSUER: z.string(),
    INTEGRITY_REST_02_SIGNATURE_KID: z.string(),
    INTEGRITY_REST_02_SIGNATURE_SECONDS_DURATION: z.coerce
      .number()
      .int()
      .positive(),
  })
  .transform((c) => ({
    integrityRest02SignatureIssuer: c.INTEGRITY_REST_02_SIGNATURE_ISSUER,
    integrityRest02SignatureKid: c.INTEGRITY_REST_02_SIGNATURE_KID,
    integrityRest02SignatureSecondsDuration:
      c.INTEGRITY_REST_02_SIGNATURE_SECONDS_DURATION,
  }));
export type IntegrityRest02Config = z.infer<typeof IntegrityRest02Config>;
