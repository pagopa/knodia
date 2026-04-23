import { EserviceAccessTokenClaims } from "@knodia/common-models/auth";
import { parseAuthHeaderToken } from "@knodia/fastify-zod-api-commons/auth";
import { unauthorizedError } from "@knodia/fastify-zod-api-commons/models";
import fastifyPlugin from "fastify-plugin";
import { jwtVerify, type JWTVerifyGetKey } from "jose";

interface AccessTokenAuthPluginOptions {
  acceptedAudiences: string[];
  expectedIssuer: string;
  jwksResolvers: JWTVerifyGetKey[];
}

export const accessTokenAuthPlugin =
  fastifyPlugin<AccessTokenAuthPluginOptions>(async (fastify, opts) => {
    fastify.addHook("onRequest", async (request) => {
      const token = parseAuthHeaderToken(request.headers.authorization);

      const rawPayload = await Promise.any(
        opts.jwksResolvers.map(async (jwks) => {
          const { payload } = await jwtVerify(token, jwks, {
            audience: opts.acceptedAudiences,
            issuer: opts.expectedIssuer,
          });
          return payload;
        }),
      ).catch((err: unknown) => {
        const reasons =
          err instanceof AggregateError
            ? err.errors.map((e) =>
                e instanceof Error ? e.message : String(e),
              )
            : [err instanceof Error ? err.message : String(err)];
        throw unauthorizedError(
          `Token verification failed: ${reasons.join("; ")}`,
        );
      });

      const parsed = EserviceAccessTokenClaims.safeParse(rawPayload);
      if (!parsed.success) {
        throw unauthorizedError(
          `Invalid access token claims: ${parsed.error.issues
            .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
            .join("; ")}`,
        );
      }
    });
  });
