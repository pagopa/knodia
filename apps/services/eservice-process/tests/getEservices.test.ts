import { describe, expect, it } from "vitest";

import { injectAppRequest } from "./utils.ts";

describe("GET /eservices (getEservices)", () => {
  it("should return mock e-services correctly", async () => {
    const response = await injectAppRequest().get("/eservices").query({
      limit: "10",
      offset: "0",
    });
    expect(response.statusCode).toBe(200);
  });
  it.each([
    { limit: "abc", offset: "0" },
    { limit: "abc", offset: "abc" },
    { limit: "10", offset: "abc" },
    { limit: new Date(), offset: NaN },
    { limit: 9999999, offset: 9999999 },
  ])(
    "should return 400 if query parameters are formatted incorrectly (%o)",
    async (query) => {
      const response = await injectAppRequest()
        .get("/eservices")
        .query(query as never);
      expect(response.statusCode).toBe(400);
    },
  );
});
