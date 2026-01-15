import type { Logger as PinoLogger } from "pino";

import pino from "pino";

import type { LoggerConfig } from "./types.ts";

import { buildLoggerOptions } from "./config.ts";

/**
 * Creates a standalone Pino logger instance
 * Use this for non-Fastify applications or standalone logging needs
 */
export const createLogger = (config: LoggerConfig): PinoLogger => {
  const options = buildLoggerOptions(config);
  return pino(options);
};

/**
 * Creates a child logger from an existing logger instance
 * Useful for adding context to log entries
 */
export const createChildLogger = (
  parent: PinoLogger,
  bindings: Record<string, unknown>,
): PinoLogger => parent.child(bindings);
