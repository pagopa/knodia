import type { FastifyInstance } from "fastify";

interface FastifyListenOptions {
  host: string;
  port: number;
}

/**
 * Starts a Fastify server with standard error handling and logging
 *
 * @param app - The Fastify application instance, or a promise of one (app
 *   builders are async when they check DB connectivity at startup)
 * @param options - Server configuration (host and port)
 */
export const startServer = async (
  app: FastifyInstance | Promise<FastifyInstance>,
  options: FastifyListenOptions,
): Promise<void> => {
  // The app builder itself may fail (e.g. DB connection check): no logger yet.
  const resolvedApp = await Promise.resolve(app).catch((error: unknown) => {
    console.error("Failed to start service", error);
    return process.exit(1);
  });
  try {
    await resolvedApp.listen({ host: options.host, port: options.port });
    resolvedApp.log.info("Service started successfully");
  } catch (error) {
    resolvedApp.log.error({ err: error }, "Failed to start service");
    process.exit(1);
  }
};
