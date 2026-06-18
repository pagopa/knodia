import { createHash } from "node:crypto";

// `object_id = sha256(fiscalCode + seed)` — plain hash, no HMAC. Matches the
// scheme the consumer reconstructs after reading the seed from
// `/natural-persons/pseudonymization`.
export function pseudonymize(fiscalCode: string, seed: string): string {
  return createHash("sha256")
    .update(fiscalCode + seed)
    .digest("hex");
}
