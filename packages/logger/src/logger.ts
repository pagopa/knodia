import type { Logger } from "pino";

import pino from "pino";

import type { LoggerConfig } from "./config.ts";

import { buildLoggerOptions } from "./options.ts";

export const createPinoLogger = (
  config: LoggerConfig,
  serviceName: string,
): Logger => {
  const options = buildLoggerOptions({
    ...config,
    serviceName,
  });

  return pino(options);
};
