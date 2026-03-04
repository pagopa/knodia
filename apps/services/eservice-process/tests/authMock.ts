import { vi } from "vitest";

// TODO move to test-commons when we have more than one service test using it
vi.mock("@knodia/fastify-zod-api-commons/auth", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@knodia/fastify-zod-api-commons/auth")
    >();

  const { requestContext } = await import("@fastify/request-context");
  const { KnodiaAuthTokenClaims } = await import("@knodia/common-models/auth");
  const { default: fastifyPlugin } = await import("fastify-plugin");
  const { decodeJwt } = await import("jose");

  const authenticationPlugin = fastifyPlugin(async (fastify) => {
    fastify.addHook("onRequest", async (request) => {
      const token = original.parseAuthHeaderToken(
        request.headers.authorization,
      );

      const rawPayload: unknown = decodeJwt(token);

      const parsed = KnodiaAuthTokenClaims.safeParse(rawPayload);
      if (!parsed.success) {
        throw new Error(`Invalid test token claims: ${parsed.error.message}`);
      }

      requestContext.set(
        "authData",
        original.extractAuthDataFromToken(parsed.data),
      );
    });
  });

  return {
    ...original,
    authenticationPlugin,
  };
});
