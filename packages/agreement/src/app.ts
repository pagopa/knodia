// /Users/vcaprio/Workspace/pagoPA/knodia/packages/agreement/app.ts
import express, { Request, Response } from "express";

export function createApp(description: string) {
  const app = express();
  app.use(express.json());

  // Log service name when creating the app - replace with a proper logger in the future
  // eslint-disable-next-line no-console
  console.log(`Create service: ${description}`);


  app.get("/", (_req: Request, res: Response) => {
    res.json({
      service: description,
      description: "Simple HTTP status API. See /status",
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/status", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // health check endpoint for orchestrators
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).send("OK");
  });

  return app;
}

export default createApp;
