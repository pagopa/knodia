import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.ts";

import { createLoggerOptions } from "@knodia/logger";
import { DrizzleQueryError } from "drizzle-orm/errors";
import { Writable } from "node:stream";
import { pino } from "pino";
import { describe, expect, it, vi } from "vitest";

import type { KafkaConsumerConfig } from "../src/config/config.ts";

import { runConsumer } from "../src/consumer.ts";

const email = "mario.rossi@example.com";

const payload = {
  message: { offset: "0" },
  partition: 0,
  topic: "signup.events",
} as EachMessagePayload;

let eachMessage: (payload: EachMessagePayload) => Promise<void>;

vi.mock("../src/kafka.ts", () => ({
  initKafka: () => ({
    consumer: () => ({
      connect: vi.fn(),
      on: vi.fn(),
      run: ({ eachMessage: handler }: { eachMessage: typeof eachMessage }) => {
        eachMessage = handler;
      },
      subscribe: vi.fn(),
    }),
  }),
}));
vi.mock("../src/admin.ts", () => ({ checkTopicsExist: () => true }));
vi.mock("../src/listeners.ts", () => ({ errorEventsListener: vi.fn() }));

describe("runConsumer", () => {
  it("should not log the free-text params of a failed query", async () => {
    const lines: string[] = [];
    const logger = pino(
      {
        ...createLoggerOptions({
          isProduction: true,
          logLevel: "info",
          nodeEnv: "production",
        }),
        transport: undefined,
      },
      new Writable({
        write(chunk: Buffer, _encoding, callback) {
          lines.push(chunk.toString());
          callback();
        },
      }),
    );
    const failingHandler = () =>
      Promise.reject(
        new DrizzleQueryError("update signup_user set email = $1", [email]),
      );

    await runConsumer(
      [payload.topic],
      failingHandler,
      {} as KafkaConsumerConfig,
      logger,
    );
    const thrown = await eachMessage(payload).catch((e: unknown) => e);

    expect(lines.join("")).toContain("Failed query");
    expect(lines.join("")).not.toContain(email);
    expect(String(thrown)).not.toContain(email);
  });
});
