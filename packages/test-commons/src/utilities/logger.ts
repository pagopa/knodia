import type { ServiceName } from "@knodia/common-models/services";
import type { LoggerConfig } from "@knodia/logger/config";

import { createLogger } from "@knodia/logger";

export function createTestLogger(): {
  logger: ReturnType<typeof createLogger>;
  loggerConfig: LoggerConfig;
} {
  const logger = createLogger({
    config: {
      isProduction: false,
      logLevel: "silent",
      nodeEnv: "test",
    },
    serviceName: "test-consumer" as ServiceName,
  });
  const loggerConfig: LoggerConfig = {
    isProduction: false,
    logLevel: "silent",
    nodeEnv: "test",
  };

  return { logger, loggerConfig };
}
