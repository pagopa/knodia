import { PublicKeyJwk } from "@knodia/common-models/crypto";
import z from "zod";

export const EXPECTED_DPOP_PROOF_TYP = "dpop+jwt";

const DpopProofHeader = z.strictObject({
  alg: z.union([z.literal("RS256"), z.literal("ES256")]),
  jwk: PublicKeyJwk,
  typ: z.literal(EXPECTED_DPOP_PROOF_TYP),
});
export type DpopProofHeader = z.infer<typeof DpopProofHeader>;

export const DpopProof = (expectedHtm: string) =>
  z.strictObject({
    headers: DpopProofHeader,
    payload: DpopProofPayload(expectedHtm),
  });
export type DpopProof = z.infer<ReturnType<typeof DpopProof>>;

const DpopProofPayload = (expectedHtm: string) =>
  z.strictObject({
    ath: z.string().optional(),
    htm: z.literal(expectedHtm),
    htu: z.string(),
    iat: z.number().positive(),
    jti: z.uuid(),
  });
export type DpopProofPayload = z.infer<ReturnType<typeof DpopProofPayload>>;
