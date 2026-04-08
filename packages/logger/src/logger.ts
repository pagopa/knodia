import type { ServiceName } from "@knodia/common-models/services";

import { type Logger, type LoggerOptions, multistream, pino } from "pino";

import type { LoggerConfig } from "./config.ts";
import type { LoggerMetadata } from "./models/models.ts";

const DEFAULT_REDACT_PATHS: string[] = ["req.headers.authorization"];

/**
 * Builds logger options based on the environment
 *
 * @param isProduction - Indicates if the environment is production
 * @returns Partial LoggerOptions with appropriate settings for the environment
 */
const buildLoggerEnvOptions = (
  isProduction: boolean,
): Partial<LoggerOptions> =>
  isProduction
    ? {
        timestamp: false,
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

export const createLoggerOptions = (
  config: LoggerConfig,
  serviceName: ServiceName,
): LoggerOptions => ({
  formatters: {
    bindings: () => ({}), // Removes pid, hostname and name from logs
    level: (label) => ({
      level: label.toUpperCase(),
    }),
  },
  hooks: {
    streamWrite: (s) => {
      try {
        const trimmed = s.trimEnd();

        // Parsing Pino log to remove duplicate keys and keep the latest value
        const obj = JSON.parse(trimmed);

        const { msg, ...rest } = obj;
        const ordered = msg !== undefined ? { msg, ...rest } : rest;

        return JSON.stringify(ordered) + "\n";
      } catch {
        return s;
      }
    },
  },
  level: config.logLevel,
  name: serviceName,
  redact: DEFAULT_REDACT_PATHS,
  ...buildLoggerEnvOptions(config.isProduction),
});

export const createLogger = ({
  config,
  loggerMetadata,
  serviceName,
}: {
  config: LoggerConfig;
  loggerMetadata?: LoggerMetadata;
  serviceName: ServiceName;
}): Logger => {
  const streams = [
    { level: "trace", stream: process.stdout },
    { level: "error", stream: process.stderr },
  ];

  return pino(
    createLoggerOptions(config, serviceName),
    multistream(streams, { dedupe: true }),
  ).child(loggerMetadata ?? {});
};
