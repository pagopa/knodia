import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { describe, expect, it } from "vitest";

import { escapeSqlLike, ilikeEscaped } from "../src/utils/utils.ts";

const db = drizzle(new Pool());
const testTable = pgTable("items", {
  name: text("name").notNull(),
});

describe("escapeSqlLike", () => {
  it("should escape percent signs", () => {
    expect(escapeSqlLike("100%")).toBe("100\\%");
    expect(escapeSqlLike("%test")).toBe("\\%test");
  });

  it("should escape underscores", () => {
    expect(escapeSqlLike("john_doe")).toBe("john\\_doe");
    expect(escapeSqlLike("_prefix")).toBe("\\_prefix");
  });

  it("should escape backslashes", () => {
    expect(escapeSqlLike("path\\file")).toBe("path\\\\file");
    expect(escapeSqlLike("\\")).toBe("\\\\");
  });

  it("should escape multiple wildcards", () => {
    expect(escapeSqlLike("2026%_knodia\\test")).toBe(
      "2026\\%\\_knodia\\\\test",
    );
  });

  it("should handle strings with no wildcards", () => {
    expect(escapeSqlLike("regular text")).toBe("regular text");
    expect(escapeSqlLike("hello world")).toBe("hello world");
  });

  it("should handle empty string", () => {
    expect(escapeSqlLike("")).toBe("");
  });

  it("should handle consecutive wildcards", () => {
    expect(escapeSqlLike("%%__\\\\")).toBe("\\%\\%\\_\\_\\\\\\\\");
  });
});

describe("ilikeEscaped", () => {
  it("should produce parameterized SQL with ILIKE and ESCAPE clause", () => {
    const pattern = "%_\\test%_\\";

    const { params, sql: sqlStr } = db
      .select()
      .from(testTable)
      .where(ilikeEscaped(testTable.name, pattern))
      .toSQL();

    expect(sqlStr).toEqual(
      'select "name" from "items" where "items"."name" ILIKE $1 ESCAPE \'\\\'',
    );
    expect(sqlStr).not.toContain(pattern);
    expect(params).toEqual([pattern]);
  });
});

describe("escapeSqlLike and ilikeEscaped integration", () => {
  it("should produce safe SQL for user input containing LIKE wildcards and backslashes", () => {
    const userInput = "2026%_knodia\\test";
    const pattern = `%${escapeSqlLike(userInput)}%`;

    const { params, sql: sqlStr } = db
      .select()
      .from(testTable)
      .where(ilikeEscaped(testTable.name, pattern))
      .toSQL();

    // The raw user input must not leak into the SQL string
    expect(sqlStr).not.toContain(userInput);

    // The escaped pattern is bound as a parameter
    expect(params).toEqual(["%2026\\%\\_knodia\\\\test%"]);

    expect(sqlStr).toEqual(
      'select "name" from "items" where "items"."name" ILIKE $1 ESCAPE \'\\\'',
    );
  });
});
