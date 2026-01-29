import { describe, expect, it } from "vitest";
import { z, ZodError } from "zod";

import { generateId } from "../src/brandedIds.ts";
import { KafkaMessageEnvelope } from "../src/events.ts";

describe("KafkaMessageEnvelope.decode", () => {
  const toHex = (value: string) => Buffer.from(value, "utf8").toString("hex");

  const TestEvent = z.discriminatedUnion("type", [
    z.object({
      data: z.unknown(),
      type: z.literal("TestEvent1"),
    }),
    z.object({
      data: z.unknown(),
      type: z.literal("TestEvent2"),
    }),
  ]);

  it("successfully decodes a valid TestEvent1 message", () => {
    const message = {
      value: JSON.stringify({
        after: {
          correlation_id: generateId(),
          data: toHex("test value"),
          log_date: new Date().toISOString(),
          sequence_num: 1,
          stream_id: generateId(),
          type: "TestEvent1",
          version: 0,
        },
      }),
    };

    const decoded = KafkaMessageEnvelope(TestEvent).decode(message);
    expect(decoded).toMatchObject({
      data: expect.any(Uint8Array),
      type: "TestEvent1",
    });
  });

  it("successfully decodes a valid TestEvent2 message", () => {
    const message = {
      value: JSON.stringify({
        after: {
          correlation_id: generateId(),
          data: toHex("test value"),
          log_date: new Date().toISOString(),
          sequence_num: 2,
          stream_id: generateId(),
          type: "TestEvent2",
          version: 1,
        },
      }),
    };
    const decoded = KafkaMessageEnvelope(TestEvent).decode(message);
    expect(decoded).toMatchObject({
      data: expect.any(Uint8Array),
      type: "TestEvent2",
    });
  });

  it.each([{}, { value: undefined }])(
    "throws a meaningful error when value is not defined (message: %o)",
    (message) => {
      try {
        KafkaMessageEnvelope(TestEvent).decode(message as { value: unknown });
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        const zodError = error as ZodError;
        expect(zodError.issues[0]).toMatchObject({
          message: `Invalid input: expected nonoptional, received ${message.value}`,
          path: ["value"],
        });
      }
    },
  );

  it.each([{ value: "" }, { value: "invalid json" }])(
    "throws a meaningful error when JSON parsing fails (message: %o)",
    (message) =>
      expect(() =>
        KafkaMessageEnvelope(TestEvent).decode(message),
      ).toThrowError(/Unexpected.*JSON/),
  );

  it("throws a meaningful error when value.after is not defined", () => {
    try {
      KafkaMessageEnvelope(TestEvent).decode({ value: "{}" });
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
      const zodError = error as ZodError;
      expect(zodError.issues[0]).toMatchObject({
        message: `Invalid input: expected nonoptional, received undefined`,
        path: ["after"],
      });
    }
  });

  it("throws a meaningful error when event is missing some required fields", () => {
    const message = {
      value: JSON.stringify({
        after: {
          // correlation_id is missing
          // sequence_num is missing
          // type is missing
          data: toHex("test value"),
          log_date: new Date().toISOString(),
          stream_id: generateId(),
          version: 0,
        },
      }),
    };

    try {
      KafkaMessageEnvelope(TestEvent).decode(message);
    } catch (error) {
      expect(error).toBeInstanceOf(ZodError);
      const zodError = error as ZodError;
      expect(zodError.issues[0]).toMatchObject({
        message: "Invalid input: expected string, received undefined",
        path: ["correlation_id"],
      });
      expect(zodError.issues[1]).toMatchObject({
        message: "Invalid input: expected number, received undefined",
        path: ["sequence_num"],
      });
      expect(zodError.issues[2]).toMatchObject({
        message: /Invalid input.*/,
        path: ["type"],
      });
    }
  });
});
