import { vi } from "vitest";

/**
 * Factories for the auth-related `vi.mock` bodies shared by every BFF router
 * test: `jose`, `@aws-sdk/client-kms`. The `vi.hoisted(…)` spy creation stays
 * inline in each test file (it runs before imports resolve, so it cannot
 * reference helpers from here), but the `vi.mock(…)` factory bodies can live
 * here because Vitest calls them lazily when the mocked module is requested.
 *
 * The `jose` factory stubs `createRemoteJWKSet` with a URL-keyed return value
 * (`mock-jwks:<url>`), so tests that pin `jwtVerify`'s jwks argument can tell
 * the Cognito JWKS from the BFF well-known JWKSs.
 */

type MockFn = ReturnType<typeof vi.fn<(...args: unknown[]) => unknown>>;

export function joseMockFactory({
  mockDecodeJwt,
  mockJwtVerify,
}: {
  mockDecodeJwt: MockFn;
  mockJwtVerify: MockFn;
}) {
  return {
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
