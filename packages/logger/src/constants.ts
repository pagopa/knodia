import type { LogLevel, PrettyPrintOptions } from "./types.ts";

export const DEFAULT_LOG_LEVEL: LogLevel = "info";

export const DEFAULT_REDACT_PATHS: string[] = ["req.headers.authorization"];

export const DEFAULT_PRETTY_OPTIONS: PrettyPrintOptions = {
  colorize: true,
  ignore: "pid,hostname",
  translateTime: "HH:MM:ss Z",
};

/**
 * Environments where pretty printing is disabled by default
 */
export const PRODUCTION_ENVIRONMENTS = ["PROD", "production"] as const;
