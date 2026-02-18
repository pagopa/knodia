import type { LoggerOptions } from "pino";
import { ServiceName } from "@knodia/common-models/services";

import type { LoggerConfig } from "./config.ts";

const DEFAULT_REDACT_PATHS: string[] = ["req.headers.authorization"];

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

export const createLoggerOptions = (
  config: LoggerConfig,
  serviceName: ServiceName,
): LoggerOptions => ({
  level: config.logLevel,
  name: serviceName,
  redact: DEFAULT_REDACT_PATHS,
  ...resolvePrettyConfig(config.isProduction),
});
