import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const loggerUrl = new URL("../src/logger.ts", import.meta.url).href;

// Logs, then lets the process exit on its own, like a one-shot job.
const script = `
import { pino } from "pino";
import { createLoggerOptions } from ${JSON.stringify(loggerUrl)};

const logger = pino(
  createLoggerOptions({ isProduction: true, logLevel: "info", nodeEnv: "production" }),
);
for (let i = 0; i < 100; i++) logger.info({ i }, "info line");
logger.error("error line");
`;

describe("production transport", () => {
  it("writes every log before the process exits", async () => {
    const { stderr, stdout } = await promisify(execFile)(
      process.execPath,
      ["--input-type=module", "--eval", script],
      { cwd: new URL("..", import.meta.url) },
    );

    expect(stdout.trim().split("\n")).toHaveLength(100);
    expect(JSON.parse(stderr)).toMatchObject({
      level: "ERROR",
      msg: "error line",
    });
  });
});
