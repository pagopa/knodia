import { describe, expect, it } from "vitest";

describe("GET /consumer-keychains (getConsumerKeychains)", () => {
  const defaultQuery = {
    limit: "4",
    offset: "0",
  };

  it.todo.each([
    { limit: "abc", offset: "0" },
    { limit: "0", offset: "0" },
    { limit: "51", offset: "0" },
    { limit: "10", offset: "-1" },
    { limit: new Date(), offset: NaN },
    { limit: 9999999, offset: 9999999 },
    {
      ...defaultQuery,
      invalidParam: "invalid",
    },
  ])(
    "should return 400 if query parameters are formatted incorrectly (%o)",
    async () => {
      expect(true).toBe(true);
    },
  );
});
