import { KafkaJS } from "@confluentinc/kafka-javascript";
import { pino } from "pino";
import { describe, expect, it } from "vitest";

import { pinoKafkaLogger } from "../src/utils/kafkaLogger.ts";

function captureKafkaLogger() {
  const lines: string[] = [];
  const logger = pinoKafkaLogger(
    pino(
      { base: null, timestamp: false },
      { write: (chunk) => lines.push(chunk) },
    ),
  );
  return { lines, logger };
}

describe("pinoKafkaLogger", () => {
  it("emits a message with an embedded multi-line stack trace on a single line", () => {
    const { lines, logger } = captureKafkaLogger();

    const err = new Error("Error handling Kafka message");
    expect(err.stack).toContain("\n"); // guard: the stack really is multi-line

    // Mirrors how the confluent client logs a consumer failure: the multi-line
    // stack is interpolated into the message string, plus a metadata object.
    logger.error(
      `Consumer encountered error while processing message. Error details: ${err}: ${err.stack}. The same message may be reprocessed.`,
      { fac: "CONSUME", name: "signup-updater" },
    );

    expect(lines).toHaveLength(1);
    const output = lines.join("");

    // A single physical line: exactly one trailing newline, none embedded.
    expect(output.endsWith("\n")).toBe(true);
    expect(output.trimEnd()).not.toContain("\n");

    const parsed = JSON.parse(output);
    expect(parsed.msg).toContain(
      "Consumer encountered error while processing message",
    );
    expect(parsed.msg).toContain("at "); // stack frames retained
    expect(parsed.fac).toBe("CONSUME");
    expect(parsed.level).toBe(50); // pino error level
  });

  it("normalises an Error argument into structured single-line JSON", () => {
    const { lines, logger } = captureKafkaLogger();

    // Some internal call sites pass an Error where the type says string.
    logger.error(new Error("connect failed") as unknown as string, {
      fac: "FAIL",
    });

    expect(lines).toHaveLength(1);
    const output = lines.join("");
    expect(output.trimEnd()).not.toContain("\n");
    const parsed = JSON.parse(output);
    expect(parsed.msg).toBe("connect failed");
    expect(parsed.err.type).toBe("Error");
    expect(parsed.fac).toBe("FAIL");
  });

  it("maps confluent log levels to pino levels and filters below the threshold", () => {
    const { lines, logger } = captureKafkaLogger();

    logger.setLogLevel(KafkaJS.logLevel.ERROR);
    logger.info("filtered out");
    logger.error("let through");

    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines.join("")).msg).toBe("let through");
  });

  it("tags a namespaced child logger and honours its per-namespace level", () => {
    const { lines, logger } = captureKafkaLogger();

    const child = logger.namespace("CONSUMER", KafkaJS.logLevel.ERROR);
    child.info("filtered out by namespace level");
    child.error("let through");

    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines.join(""));
    expect(parsed.namespace).toBe("CONSUMER");
    expect(parsed.msg).toBe("let through");
  });
});
