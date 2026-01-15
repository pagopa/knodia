import app from "./app.ts";
import { config } from "./config.ts";

const start = async () => {
  try {
    await app.listen({ port: config.port });
    app.log.info("Service started successfully");
  } catch (error) {
    app.log.error({ err: error }, "Failed to start service");
    process.exit(1);
  }
};

void start();
