import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../src/app.ts";

const app = buildApp({
  config: {
    isProduction: false,
    logLevel: "silent",
    nodeEnv: "test",
  },
});

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("POST /token", () => {
  it("returns a mocked bearer token", async () => {
    const response = await app.inject({
      method: "POST",
      payload: {
        client_id: "test-client",
        grant_type: "client_credentials",
        scope: "eservices.read",
      },
      url: "/token",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      access_token: "mock-access-token",
      expires_in: 300,
      token_type: "Bearer",
    });
  });
});
