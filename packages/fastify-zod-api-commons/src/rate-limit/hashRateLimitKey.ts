import { createHash } from "crypto";
import { z } from "zod";

// Branded so it can join `RateLimitKey` as a closed union member instead of
// widening it to `string` — keeps the branded-org-id guarantee for every other
// caller, and makes "this is a hashed key" explicit in the type.
export const HashedRateLimitKey = z.string().brand<"HashedRateLimitKey">();
export type HashedRateLimitKey = z.infer<typeof HashedRateLimitKey>;

// The signup rate-limit key is the caller's person identifier (fiscalNumber,
// spidCode or PersonIdentifier) — PII that would otherwise be stored verbatim
// as a Redis key and echoed in degraded-mode logs. Hash it first so the
// plaintext identifier never leaves the request. SHA-256 over a low-entropy
// input (national IDs) isn't brute-force-resistant, but the goal is avoiding
// at-rest plaintext, not making the identifier unrecoverable. The digest is
// deterministic, so the same person always maps to the same bucket.
export function hashRateLimitKey(value: string): HashedRateLimitKey {
  return HashedRateLimitKey.parse(
    createHash("sha256").update(value).digest("base64url"),
  );
}
