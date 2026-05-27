import { describe, expect, it } from "vitest";

import { app, oneIdentityMockConfig } from "./setup.ts";

describe("GET /auth/oidc/start (startOIDCSession)", () => {
  it("returns 302 with the location header containing the required parameters", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/auth/oidc/start",
    });

    expect(response.statusCode).toBe(302);

    const locationHeader = new URL(response.headers["location"] ?? "");
    const locationSearchParams = locationHeader.searchParams;

    expect(locationHeader.pathname).toBe("/login");

    expect(locationSearchParams.get("nonce")).toBeDefined();
    expect(locationSearchParams.get("state")).toBeDefined();

    expect(locationSearchParams.get("redirect_uri")).toBe(
      oneIdentityMockConfig.oneIdentityRedirectUrl,
    );
    expect(locationSearchParams.get("client_id")).toBe(
      oneIdentityMockConfig.oneIdentityClientId,
    );

    expect(locationSearchParams.get("scope")).toBe("openid");
    expect(locationSearchParams.get("response_type")).toBe("code");
  });

  it('returns 302 with the cookie "oidc-session" in the response headers containing nonce and state', async () => {
    const response = await app.inject({
      method: "GET",
      url: "/auth/oidc/start",
    });

    expect(response.statusCode).toBe(302);

    const setCookieHeader = response.headers["set-cookie"] as string;
    expect(setCookieHeader).toBeDefined();

    expect(setCookieHeader.startsWith("oidc-session=")).toBe(true);

    // Extract the encoded value: oidc-session=<encoded-json>; Path=...
    const cookieValue = setCookieHeader.split(";")[0]?.split("=")[1];
    const decoded = decodeURIComponent(cookieValue ?? "");
    const cookieData = JSON.parse(decoded) as { nonce: string; state: string };

    const locationSearchParams = new URL(response.headers["location"] ?? "")
      .searchParams;

    expect(cookieData.nonce).toBeDefined();
    expect(cookieData.nonce).toBe(locationSearchParams.get("nonce"));
    expect(cookieData.nonce.length).toBeGreaterThan(0);

    expect(cookieData.state).toBeDefined();
    expect(cookieData.state).toBe(locationSearchParams.get("state"));
    expect(cookieData.state.length).toBeGreaterThan(0);

    // Verify cookie attributes
    expect(setCookieHeader).toContain("Path=/");
    expect(setCookieHeader).toContain("HttpOnly");
    expect(setCookieHeader).toContain("SameSite=Strict");
  });
});
