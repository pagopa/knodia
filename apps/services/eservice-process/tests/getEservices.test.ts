import { describe, expect, it } from "vitest";

import { injectAppRequest } from "./utils.ts";

describe("GET /eservices (getEservices)", () => {
  it("should return mock eservices", async () => {
    const response = await injectAppRequest().get("/eservices").query({
      limit: "10",
      offset: "0",
    });
    expect(response.statusCode).toBe(200);
  });
});
