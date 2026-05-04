import { Algorithm } from "@knodia/common-models/crypto";

export const EXPECTED_GRANT_TYPE = "client_credentials";

export const EXPECTED_CLIENT_ASSERTION_TYPE =
  "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
export const EXPECTED_CLIENT_ASSERTION_ALGORITHM = Algorithm.enum.RS256;
export const EXPECTED_CLIENT_ASSERTION_TYP = "JWT";

export const EXPECTED_DPOP_PROOF_TYP = "dpop+jwt";
export const EXPECTED_DPOP_PROOF_HTM = "POST";
