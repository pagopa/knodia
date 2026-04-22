import { PublicKeyJwk } from "@knodia/common-models/crypto";
import z from "zod";

import {
  EXPECTED_DPOP_PROOF_HTM,
  EXPECTED_DPOP_PROOF_TYP,
} from "./constants.ts";

const DPoPProofHeader = z.strictObject({
  alg: z.union([z.literal("RS256"), z.literal("ES256")]),
  jwk: PublicKeyJwk,
  typ: z.literal(EXPECTED_DPOP_PROOF_TYP),
});

const DPoPProofPayload = z.strictObject({
  htm: z.literal(EXPECTED_DPOP_PROOF_HTM),
  htu: z.string(),
  iat: z.number().positive(),
  jti: z.uuid(),
});

export const DPoPProof = z.strictObject({
  header: DPoPProofHeader,
  payload: DPoPProofPayload,
});
export type DPoPProof = z.infer<typeof DPoPProof>;
