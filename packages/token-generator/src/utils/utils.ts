import { calculateKid } from "@knodia/crypto";

/* This is to avoid repeating the logic of "calculateKid"
and to have a more meaningful name for the generation of the CNF 
claim inside DPoP tokens */
export function calculateDpopThumbprint(jwk: JsonWebKey): string {
  return calculateKid(jwk);
}
