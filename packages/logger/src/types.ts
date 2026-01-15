import type {
  Logger as PinoLogger,
  LoggerOptions as PinoLoggerOptions,
} from "pino";

/**
 * Configuration options for the logger
 */
export interface LoggerConfig {
  /** Additional base properties to include in every log entry */
  base?: Record<string, unknown>;
  /** Log level. Default: process.env.LOG_LEVEL || "info" */
  level?: LogLevel;
  /** Enable pretty printing. Default: true when NODE_ENV !== "PROD" and NODE_ENV !== "production" */
  prettyPrint?: boolean | PrettyPrintOptions;
  /** Fields to redact from logs (e.g., sensitive data). Default: ["req.headers.authorization"] */
  redact?: string[];
  /** Service name to be included in log entries */
  serviceName: string;
}

/**
 * Log levels supported by the logger
 */
export type LogLevel =
  | "debug"
  | "error"
  | "fatal"
  | "info"
  | "silent"
  | "trace"
  | "warn";

/**
 * Pretty print configuration options
 */
export interface PrettyPrintOptions {
  /** Enable colorized output. Default: true */
  colorize?: boolean;
  /** Fields to ignore in pretty output (comma-separated). Default: "pid,hostname" */
  ignore?: string;
  /** Time format for pretty output. Default: "HH:MM:ss Z" */
  translateTime?: string;
}

/**
 * Re-export Pino types for convenience
 */
export type { PinoLogger, PinoLoggerOptions };
