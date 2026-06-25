import { createHash } from "crypto";
import { z } from "zod";

// Branded so it can join `RateLimitKey` as a closed union member instead of
// widening it to `string`, and to make "this is a hashed key" explicit.
export const HashedRateLimitKey = z.string().brand<"HashedRateLimitKey">();
export type HashedRateLimitKey = z.infer<typeof HashedRateLimitKey>;

// The signup rate-limit key is the caller's person identifier (PII). Hash it so
// the plaintext never lands in a Redis key or a degraded-mode log. The digest is
// deterministic, so the same person always maps to the same bucket. SHA-256 over
// low-entropy national IDs isn't brute-force-resistant, but the goal is avoiding
// at-rest plaintext, not making the identifier unrecoverable.
export function hashRateLimitKey(value: string): HashedRateLimitKey {
  return HashedRateLimitKey.parse(
    createHash("sha256").update(value).digest("base64url"),
  );
}
