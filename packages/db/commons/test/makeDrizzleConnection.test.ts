import { describe, expect, it } from "vitest";

import { makeDrizzleConnection } from "../src/utils/utils.ts";

// A closed port: nothing listens on it, so any connection attempt fails fast.
const UNREACHABLE = {
  database: "nope",
  host: "127.0.0.1",
  password: "irrelevant",
  port: 1,
  user: "nobody",
  useSsl: false,
};

describe("makeDrizzleConnection", () => {
  it("fails at startup when the database is unreachable", async () => {
    await expect(makeDrizzleConnection(UNREACHABLE)).rejects.toThrow(
      'Startup connection check to database "nope" at 127.0.0.1:1 failed',
    );
  });

  it("skips the startup check when checkDbConnection is false", async () => {
    const { db, pool } = await makeDrizzleConnection(UNREACHABLE, {
      checkDbConnection: false,
    });
    expect(db).toBeDefined();
    await pool.end();
  });
});
