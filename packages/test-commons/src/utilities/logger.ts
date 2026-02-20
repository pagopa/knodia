import type { ServiceName } from "@knodia/common-models/services";
import type { LoggerConfig } from "@knodia/logger/config";

import { createLogger } from "@knodia/logger";

export function createTestLogger(): {
  logger: ReturnType<typeof createLogger>;
  loggerConfig: LoggerConfig;
} {
  const loggerConfig: LoggerConfig = {
    isProduction: false,
    logLevel: "silent",
    nodeEnv: "test",
  };

  const logger = createLogger({
    config: loggerConfig,
    serviceName: "test-consumer" as ServiceName,
  });

  return { logger, loggerConfig };
}
