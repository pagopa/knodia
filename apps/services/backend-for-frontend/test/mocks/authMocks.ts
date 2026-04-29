import { vi } from "vitest";

type MockFn = ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>;

export function joseMockFactory({
  mockDecodeJwt,
  mockJwtVerify,
}: {
  mockDecodeJwt: MockFn;
  mockJwtVerify: MockFn;
}) {
  return {
    // URL-keyed so tests can distinguish the Cognito JWKS from the BFF
    // well-known JWKSs when pinning jwtVerify's jwks argument.
    createRemoteJWKSet: vi.fn(
      (url: string | URL) => `mock-jwks:${String(url)}`,
    ),
    decodeJwt: (...args: unknown[]) => mockDecodeJwt(...args),
    jwtVerify: mockJwtVerify,
  };
}

export function kmsMockFactory({ mockKmsSend }: { mockKmsSend: MockFn }) {
  return {
    KMSClient: function MockKMSClient() {
      return { send: mockKmsSend };
    },
    SignCommand: function MockSignCommand(
      input: Record<string, unknown>,
    ): Record<string, unknown> {
      return { ...input };
    },
  };
}
