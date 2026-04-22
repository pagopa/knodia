import { type createRemoteJWKSet, jwtVerify } from "jose";

import { unauthorizedError } from "../models/errors/errors.ts";

/**
 * Verify a JWT against any of the given JWKS sets. The first set whose keys
 * match succeeds; if every set rejects, throw a 401 with `errorMessage`.
 *
 * Centralises the `Promise.any(...).catch(→ unauthorized)` pattern used by
 * bearer authentication, refresh-token verification, and magic-link
 * verification.
 */
export async function verifyAgainstJwksSets({
  algorithms,
  audience,
  errorMessage = "Token verification failed",
  issuer,
  jwksSets,
  token,
}: {
  algorithms?: string[];
  audience?: string | string[];
  errorMessage?: string;
  issuer?: string;
  jwksSets: ReturnType<typeof createRemoteJWKSet>[];
  token: string;
}): Promise<unknown> {
  return Promise.any(
    jwksSets.map(async (jwks) => {
      const { payload } = await jwtVerify(token, jwks, {
        algorithms,
        audience,
        issuer,
      });
      return payload;
    }),
  ).catch(() => {
    throw unauthorizedError(errorMessage);
  });
}
