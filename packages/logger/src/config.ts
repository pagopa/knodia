import type { LoggerOptions as PinoLoggerOptions } from "pino";

import type { LoggerConfig, LogLevel, PrettyPrintOptions } from "./types.ts";

import {
  DEFAULT_LOG_LEVEL,
  DEFAULT_PRETTY_OPTIONS,
  DEFAULT_REDACT_PATHS,
  PRODUCTION_ENVIRONMENTS,
} from "./constants.ts";

/**
 * Determines if the current environment is production
 */
const isProduction = (): boolean => {
  const env = process.env["NODE_ENV"];
  return (
    env !== undefined &&
    PRODUCTION_ENVIRONMENTS.includes(
      env as (typeof PRODUCTION_ENVIRONMENTS)[number],
    )
  );
};

/**
 * Resolves pretty print configuration
 */
const resolvePrettyConfig = (
  prettyPrint: boolean | PrettyPrintOptions | undefined,
): Partial<PinoLoggerOptions> => {
  // If explicitly disabled or in production with no explicit setting
  if (prettyPrint === false || (prettyPrint === undefined && isProduction())) {
    return {};
  }

  const options: PrettyPrintOptions =
    typeof prettyPrint === "object"
      ? { ...DEFAULT_PRETTY_OPTIONS, ...prettyPrint }
      : DEFAULT_PRETTY_OPTIONS;

  return {
    transport: {
      options: {
        colorize: options.colorize,
        ignore: options.ignore,
        translateTime: options.translateTime,
      },
      target: "pino-pretty",
    },
  };
};

/**
 * Builds Pino LoggerOptions from LoggerConfig
 * Use this for Fastify integration or when you need raw options
 */
export const buildLoggerOptions = (config: LoggerConfig): PinoLoggerOptions => {
  const level =
    config.level ??
    (process.env["LOG_LEVEL"] as LogLevel | undefined) ??
    DEFAULT_LOG_LEVEL;
  const redact = config.redact ?? DEFAULT_REDACT_PATHS;
  const prettyConfig = resolvePrettyConfig(config.prettyPrint);

  return {
    base: config.base ?? {},
    level,
    name: config.serviceName,
    redact,
    ...prettyConfig,
  };
};
