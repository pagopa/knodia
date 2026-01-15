import type { LogLevel } from "./config.ts";

/**
 * Logger configuration parameters
 */
export interface LoggerConfigParams {
  logLevel: LogLevel;
  prettyPrint?: boolean;
  serviceName: string;
}
