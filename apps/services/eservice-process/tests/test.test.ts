import { setupReadmodelTestDatabase } from "@knodia/test-commons/readmodel";
import { describe, expect, inject, it } from "vitest";

describe("Sample Test", () => {
  it("should pass (retrieve test container)", async () => {
    const connectionString = await setupReadmodelTestDatabase(
      inject("READMODEL_CONNECTION_STRING"),
    );
    console.log(connectionString);

    expect(true).toBe(true);
  });
  it("should pass2", () => {
    expect(true).toBe(true);
  });
  it("should pass3 (slower test)", async () => {
    expect(true).toBe(true);
  });
});
