import app from "./app.ts";

// TODO : change this when we have a proper env var management
const port = Number(process.env["PORT"] ?? 3000);

const start = async () => {
  try {
    await app.listen({ port });
    app.log.info("Service started successfully");
  } catch (error) {
    app.log.error({ err: error }, "Failed to start service");
    process.exit(1);
  }
};

void start();
