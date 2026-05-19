import { signalHubDbConfig } from "@knodia/db-signal-hub/config";
import { LoggerConfig } from "@knodia/logger/config";
import { SignalHubSeedEnvConfig } from "@knodia/mock-eservice-signal-hub-commons/config";

const CronJobConfig = LoggerConfig.and(SignalHubSeedEnvConfig);

export const config = {
  ...CronJobConfig.parse(process.env),
  ...signalHubDbConfig,
};
