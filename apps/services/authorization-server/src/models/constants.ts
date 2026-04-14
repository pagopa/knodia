import { Algorithm } from "@knodia/common-models/algorithms";

export const EXPECTED_CLIENT_ASSERTION_TYPE =
  "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
export const EXPECTED_GRANT_TYPE = "client_credentials";
export const EXPECTED_CLIENT_ASSERTION_ALGORITHM = Algorithm.enum.RS256;
export const EXPECTED_CLIENT_ASSERTION_TYP = "JWT";
