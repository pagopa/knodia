import type { LevelWithSilent } from "pino";

import { z } from "zod";

const logLevels = [
  "debug",
  "error",
  "fatal",
  "info",
  "silent",
  "trace",
  "warn",
] as const satisfies LevelWithSilent[]; // guard to ensure valid pino log levels

export const LogLevel = z.enum(logLevels);
export type LogLevel = z.infer<typeof LogLevel>;

const NodeEnv = z.enum(["development", "DEV", "production", "PROD", "test"]);

export const LoggerConfig = z
  .object({
    LOG_LEVEL: LogLevel.default("info"),
    NODE_ENV: NodeEnv.default("development"),
  })
  .transform((c) => ({
    isProduction: c.NODE_ENV === "production" || c.NODE_ENV === "PROD",
    logLevel: c.LOG_LEVEL,
    nodeEnv: c.NODE_ENV,
  }));

export type LoggerConfig = z.infer<typeof LoggerConfig>;
