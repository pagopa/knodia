import { calculateKid } from "@knodia/crypto";

/* This is to avoid repeating the logic of the "calculateKid", 
and to have a more meaningful name for the generation of the CNF 
field inside the DPoP tokens */
export function calculateDpopThumbprint(jwk: JsonWebKey): string {
  return calculateKid(jwk);
}
