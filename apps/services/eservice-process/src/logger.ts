import type { LoggerOptions } from "pino";

export const serviceName = "eservice-process";

export const createLogger = (options?: LoggerOptions): LoggerOptions => {
  // TODO : change this when we have a proper env var management
  const env = process.env["NODE_ENV"];
  const level = process.env["LOG_LEVEL"] || "info";
  const prettyConfig =
    env !== "PROD"
      ? {
          transport: {
            options: {
              ignore: "pid,hostname",
              translateTime: "HH:MM:ss Z",
            },
            target: "pino-pretty",
          },
        }
      : {};

  return {
    base: { service: serviceName },
    level: level ?? "info",
    name: serviceName,
    redact: ["req.headers.authorization"], // omit sensitive data
    ...prettyConfig,
    ...options,
  };
};
