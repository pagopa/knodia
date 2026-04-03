import { describe, expect, it } from "vitest";

import { app } from "./setup.ts";

describe("POST /token", () => {
  it("returns a mocked bearer token", async () => {
    const response = await app.inject({
      method: "POST",
      payload: {
        mockClientAssertion: "mock-client-assertion",
      },
      url: "/token",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      mockAccessToken: "mock-access-token",
    });
  });
});
