import { jwtVerify, type JWTVerifyGetKey } from "jose";

import { unauthorizedError } from "../models/errors/errors.ts";

export async function verifyAgainstJwksSets({
  algorithms,
  audience,
  errorMessage = "Token verification failed",
  issuer,
  jwksSets,
  propagateReasons = false,
  token,
  typ,
}: {
  algorithms?: string[];
  audience?: string | string[];
  errorMessage?: string;
  issuer?: string;
  jwksSets: JWTVerifyGetKey[];
  propagateReasons?: boolean;
  token: string;
  typ?: string;
}): Promise<unknown> {
  return Promise.any(
    jwksSets.map(async (jwks) => {
      const { payload } = await jwtVerify(token, jwks, {
        algorithms,
        audience,
        issuer,
        typ,
      });
      return payload;
    }),
  ).catch((err: unknown) => {
    if (!propagateReasons) {
      throw unauthorizedError(errorMessage);
    }
    const reasons =
      err instanceof AggregateError
        ? err.errors.map((e) => (e instanceof Error ? e.message : String(e)))
        : [err instanceof Error ? err.message : String(err)];
    throw unauthorizedError(`${errorMessage}: ${reasons.join("; ")}`);
  });
}
