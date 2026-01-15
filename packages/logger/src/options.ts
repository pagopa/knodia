import type { LoggerOptions } from "pino";

import type { LoggerConfigParams } from "./types.ts";

export const DEFAULT_REDACT_PATHS: string[] = ["req.headers.authorization"];

/**
 * Resolves pretty print configuration for logs based on environment
 *
 * @param isProduction - Indicates if the environment is production
 * @returns Partial LoggerOptions with pretty print settings
 */
const resolvePrettyConfig = (isProduction: boolean): Partial<LoggerOptions> =>
  isProduction
    ? {}
    : {
        transport: {
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "HH:MM:ss Z",
          },
          target: "pino-pretty",
        },
      };

export const buildLoggerOptions = (
  config: LoggerConfigParams,
): LoggerOptions => ({
  level: config.logLevel,
  name: config.serviceName,
  redact: DEFAULT_REDACT_PATHS, // Always redact sensitive auth data information as default
  ...resolvePrettyConfig(config.prettyPrint ?? false),
});
