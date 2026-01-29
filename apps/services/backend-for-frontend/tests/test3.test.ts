import { describe, expect, it } from "vitest";

import { getAllEservices, insertMockEservice } from "./utils.ts";

describe("Sample Test", () => {
  it("should pass (retrieve test container)", async () => {
    const eserviceCount = 11;

    for (let i = 0; i < eserviceCount; i++) {
      await insertMockEservice();
    }

    const result = await getAllEservices();

    expect(result.length).toBe(eserviceCount);

    expect(true).toBe(true);
  });
  it("should pass2", async () => {
    const eserviceCount = 10;

    for (let i = 0; i < eserviceCount; i++) {
      await insertMockEservice();
    }

    const result = await getAllEservices();

    expect(result.length).toBe(eserviceCount);

    expect(true).toBe(true);
  });
  it("should pass3 (slower test)", async () => {
    const eserviceCount = 100;

    for (let i = 0; i < eserviceCount; i++) {
      await insertMockEservice();
    }

    const result = await getAllEservices();

    expect(result.length).toBe(eserviceCount);

    expect(true).toBe(true);
  });
});
