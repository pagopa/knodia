import { type createRemoteJWKSet, jwtVerify } from "jose";

import { unauthorizedError } from "../models/errors/errors.ts";

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
