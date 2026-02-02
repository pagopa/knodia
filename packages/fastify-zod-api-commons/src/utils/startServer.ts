import type { FastifyInstance } from "fastify";

interface FastifyListenOptions {
  host: string;
  port: number;
}

/**
 * Starts a Fastify server with standard error handling and logging
 *
 * @param app - The Fastify application instance
 * @param options - Server configuration (host and port)
 */
export const startServer = async (
  app: FastifyInstance,
  options: FastifyListenOptions,
): Promise<void> => {
  try {
    await app.listen({ host: options.host, port: options.port });
    app.log.info("Service started successfully");
  } catch (error) {
    app.log.error({ err: error }, "Failed to start service");
    process.exit(1);
  }
};
