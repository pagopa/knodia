import { describe, expect, it, vi } from "vitest";

const mockAxiosPost = vi.hoisted(() => vi.fn());

vi.mock("axios", async (importOriginal) => {
  const original = await importOriginal<typeof import("axios")>();

  return {
    ...original,
    default: { ...original.default, post: mockAxiosPost },
    post: mockAxiosPost,
  };
});

import type { OneIdentityConfig } from "../src/config/config.ts";

import { oneIdentityClientBuilder } from "../src/clients/oneIdentityClient.ts";

// Browser-facing base (login URL + issuer) and the server-reachable base (JWKS
// + token exchange) deliberately differ, as they do in containerized setups.
const config: OneIdentityConfig = {
  oneIdentityClientId: "client-id",
  oneIdentityClientSecret: "client-secret",
  oneIdentityDomain: "http://browser-host:4568",
  oneIdentityJWKSUri: "http://server-host:3000/jwks",
  oneIdentityRedirectUrl: "http://localhost:5176/ui/login/callback",
  uiSignupSessionJwt: {
    audience: "aud",
    issuer: "iss",
    kid: "kid",
    secondsDuration: 300,
  },
};

describe("oneIdentityClient", () => {
  it("builds the browser login URL on oneIdentityDomain", () => {
    const url = oneIdentityClientBuilder(config).buildOneIdentityLoginUrl({
      nonce: "n",
      state: "s",
    });

    expect(url.startsWith("http://browser-host:4568/login?")).toBe(true);
  });

  it("exchanges the code against the server-reachable host, not the browser-facing one", async () => {
    mockAxiosPost.mockReset();
    mockAxiosPost.mockResolvedValueOnce({
      data: {
        access_token: "a",
        expires_in: 3600,
        id_token: "i",
        scope: "openid",
        token_type: "Bearer",
      },
    });

    await oneIdentityClientBuilder(config).exchangeAuthorizationCode("code");

    expect(mockAxiosPost).toHaveBeenCalledWith(
      "http://server-host:3000/oidc/token",
      expect.any(String),
      expect.anything(),
    );
    expect(mockAxiosPost).not.toHaveBeenCalledWith(
      expect.stringContaining("browser-host"),
      expect.anything(),
      expect.anything(),
    );
  });

  it("preserves the oneIdentityDomain path prefix when swapping the host", async () => {
    mockAxiosPost.mockReset();
    mockAxiosPost.mockResolvedValueOnce({
      data: {
        access_token: "a",
        expires_in: 3600,
        id_token: "i",
        scope: "openid",
        token_type: "Bearer",
      },
    });

    await oneIdentityClientBuilder({
      ...config,
      oneIdentityDomain: "https://oneid.example/realm",
      oneIdentityJWKSUri: "https://oneid.internal:8443/realm/jwks",
    }).exchangeAuthorizationCode("code");

    expect(mockAxiosPost).toHaveBeenCalledWith(
      "https://oneid.internal:8443/realm/oidc/token",
      expect.any(String),
      expect.anything(),
    );
  });
});
