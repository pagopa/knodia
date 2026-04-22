import { EserviceAccessTokenClaims } from "@knodia/common-models/auth";
import { parseAuthHeaderToken } from "@knodia/fastify-zod-api-commons/auth";
import { ApiError } from "@knodia/fastify-zod-api-commons/models";
import fastifyPlugin from "fastify-plugin";
import { jwtVerify, type JWTVerifyGetKey } from "jose";

interface AccessTokenAuthPluginOptions {
  acceptedAudience: string;
  expectedIssuer: string;
  jwksResolvers: JWTVerifyGetKey[];
}

// Mock-eservice is a frontier producer: it just rejects invalid tokens with a
// plain 401, no internal API_Problem shape.
const replyUnauthorized = (reply: {
  code: (n: number) => { send: (body: unknown) => unknown };
}) => reply.code(401).send({ error: "Unauthorized" });

export const accessTokenAuthPlugin =
  fastifyPlugin<AccessTokenAuthPluginOptions>(async (fastify, opts) => {
    fastify.addHook("onRequest", async (request, reply) => {
      let token: string;
      try {
        token = parseAuthHeaderToken(request.headers.authorization);
      } catch (err) {
        if (err instanceof ApiError) return replyUnauthorized(reply);
        throw err;
      }

      const rawPayload = await Promise.any(
        opts.jwksResolvers.map(async (jwks) => {
          const { payload } = await jwtVerify(token, jwks, {
            audience: opts.acceptedAudience,
            issuer: opts.expectedIssuer,
          });
          return payload;
        }),
      ).catch(() => undefined);

      if (
        !rawPayload ||
        !EserviceAccessTokenClaims.safeParse(rawPayload).success
      ) {
        return replyUnauthorized(reply);
      }

      return undefined;
    });
  });
