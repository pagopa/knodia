import { DrizzleQueryError } from "drizzle-orm/errors";
import { Writable } from "node:stream";
import { pino } from "pino";
import { describe, expect, it } from "vitest";

import { createLoggerOptions, redactQueryParams } from "../src/logger.ts";

const query = 'select "id" from "signup_user" where "email" = $1 and "id" = $2';
const email = "mario.rossi@example.com";
const userId = "1f0e9c7a-3b2d-4e5f-8a9b-0c1d2e3f4a5b";

const makeQueryError = (params: unknown[]) =>
  new DrizzleQueryError(query, params, new Error("connection terminated"));

describe("redactQueryParams", () => {
  it("should redact free-text params and keep identifiers, numbers, booleans, dates and timestamps", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    const error = redactQueryParams(
      makeQueryError([
        email,
        userId,
        42,
        true,
        null,
        date,
        "2026-01-01T00:00:00.000Z",
        "2026-01-01 10:00:00",
        "Active",
        [userId, "Mario"],
      ]),
    );

    expect(error.params).toEqual([
      "<redacted string(23)>",
      userId,
      42,
      true,
      null,
      date,
      "2026-01-01T00:00:00.000Z",
      "2026-01-01 10:00:00",
      "<redacted string(6)>",
      [userId, "<redacted string(5)>"],
    ]);
  });

  it("should remove the redacted values from message and stack", () => {
    const error = redactQueryParams(makeQueryError([email, userId]));

    expect(error.message).toBe(
      `Failed query: ${query}\nparams: <redacted string(23)>,${userId}`,
    );
    expect(error.stack).not.toContain(email);
    expect(error.stack).toMatch(/\n\s+at /);
  });

  it("should redact query errors wrapped as cause or in an AggregateError", () => {
    const caused = new Error("wrapper", { cause: makeQueryError([email]) });
    const aggregated = new AggregateError([makeQueryError([email])]);

    redactQueryParams(caused);
    redactQueryParams(aggregated);

    expect((caused.cause as Error).message).not.toContain(email);
    expect(
      (aggregated.errors.at(0) as Error | undefined)?.message,
    ).not.toContain(email);
  });

  it("should be idempotent", () => {
    const error = makeQueryError([email]);

    redactQueryParams(error);
    const { message } = error;
    redactQueryParams(error);

    expect(error.message).toBe(message);
  });

  it("should leave other errors untouched", () => {
    const error = new Error(`Failed query: ${email}`);

    redactQueryParams(error);

    expect(error.message).toBe(`Failed query: ${email}`);
  });
});

describe("createLoggerOptions", () => {
  it("should redact query params of logged errors", () => {
    const lines: string[] = [];
    const destination = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        lines.push(chunk.toString());
        callback();
      },
    });
    const logger = pino(
      {
        ...createLoggerOptions({
          isProduction: true,
          logLevel: "info",
          nodeEnv: "production",
        }),
        transport: undefined,
      },
      destination,
    );

    logger.error({ err: makeQueryError([email, userId]) }, "query failed");

    expect(lines.join("")).not.toContain(email);
    expect(lines.join("")).toContain(userId);
  });
});
