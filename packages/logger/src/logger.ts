import { type Logger, type LoggerOptions, pino } from "pino";

import type { LoggerConfig } from "./config.ts";
import type { LoggerMetadata } from "./models/models.ts";

const DEFAULT_REDACT_PATHS: string[] = ["req.headers.authorization"];
const TRANSPORT_TARGET = new URL("transport.mts", import.meta.url).pathname;
/**
 * Builds logger options based on the environment
 *
 * @param isProduction - Indicates if the environment is production
 * @returns Partial LoggerOptions with appropriate settings for the environment
 */
const buildLoggerEnvOptions = (
  isProduction: boolean,
): Partial<LoggerOptions> =>
  !isProduction
    ? {
        timestamp: false,
        transport: {
          dedupe: true,
          targets: [
            {
              level: "trace",
              options: { stream: "stdout" },
              target: TRANSPORT_TARGET,
            },
            {
              level: "error",
              options: { stream: "stderr" },
              target: TRANSPORT_TARGET,
            },
          ],
        },
      }
    : {
        transport: {
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l Z",
          },
          target: "pino-pretty",
        },
      };

export const createLoggerOptions = (config: LoggerConfig): LoggerOptions => ({
  formatters: {
    bindings: () => ({}), // Removes pid, hostname and name from logs
  },
  level: config.logLevel,
  redact: DEFAULT_REDACT_PATHS,
  ...buildLoggerEnvOptions(config.isProduction),
});

export const createLogger = ({
  config,
  loggerMetadata,
}: {
  config: LoggerConfig;
  loggerMetadata?: LoggerMetadata;
}): Logger => pino(createLoggerOptions(config)).child(loggerMetadata ?? {});
