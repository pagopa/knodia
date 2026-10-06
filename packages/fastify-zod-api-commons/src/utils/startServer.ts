import type { FastifyInstance } from "fastify";

import { createLogger, exitOnStartupFailure } from "@knodia/logger";
import { type LoggerConfig } from "@knodia/logger/config";

interface StartServerOptions {
  host: string;
  // The app builder may fail before the Fastify logger exists (e.g. DB
  // connection check): its failure is logged with a logger built from this.
  loggerConfig: LoggerConfig;
  port: number;
}

/**
 * Starts a Fastify server with standard error handling and logging
 *
 * @param app - The Fastify application instance, or a promise of one (app
 *   builders are async when they check DB connectivity at startup)
 * @param options - Server configuration (host, port and logger config)
 */
export const startServer = async (
  app: FastifyInstance | Promise<FastifyInstance>,
  options: StartServerOptions,
): Promise<void> => {
  const resolvedApp = await exitOnStartupFailure(
    Promise.resolve(app),
    createLogger({ config: options.loggerConfig }),
  );
  try {
    await resolvedApp.listen({ host: options.host, port: options.port });
    resolvedApp.log.info("Service started successfully");
  } catch (error) {
    resolvedApp.log.error({ err: error }, "Failed to start service");
    process.exit(1);
  }
};
