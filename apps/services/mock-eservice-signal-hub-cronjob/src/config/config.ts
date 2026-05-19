import { SignalHubDbConfig } from "@knodia/db-signal-hub/config";
import { LoggerConfig } from "@knodia/logger/config";
import { SignalHubSeedEnvConfig } from "@knodia/mock-eservice-signal-hub-commons/config";

const CronJobConfig = LoggerConfig.and(SignalHubSeedEnvConfig).and(
  SignalHubDbConfig,
);

export const config = CronJobConfig.parse(process.env);
