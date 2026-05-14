import { vi } from "vitest";

// TODO: remove and replace with shared authMock after adding authenticationPlugin to signal hub app
vi.mock("@knodia/fastify-zod-api-commons/auth", async (importOriginal) => {
  const original =
    await importOriginal<
      typeof import("@knodia/fastify-zod-api-commons/auth")
    >();

  const { generateId, KnodeId, unsafeBrandId } =
    await import("@knodia/common-models/ids");
  const { TEST_ORGANIZATION_ID } = await import("@knodia/test-commons/auth");
  const { requestContext } = await import("@fastify/request-context");

  const validateAuthorization = () => ({
    authData: {
      organization: {
        id: TEST_ORGANIZATION_ID,
        knodeId: KnodeId.enum.Lynx,
      },
      tokenType: "knode-api" as const,
    },
    correlationId: unsafeBrandId(generateId()),
    logger: requestContext.get("logger"),
  });

  return {
    ...original,
    validateAuthorization,
  };
});
