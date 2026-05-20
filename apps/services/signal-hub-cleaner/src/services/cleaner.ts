import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { Logger } from "pino";

import { signalHubServiceBuilder } from "./signalHubService.ts";

export async function startCleaner({
  logger,
  signalHubDb,
  signalsRetentionHours,
}: {
  logger: Logger;
  signalHubDb: NodePgDatabase;
  signalsRetentionHours: number;
}) {
  const signalHubService = signalHubServiceBuilder(signalHubDb, logger);

  await signalHubService.cleanup(signalsRetentionHours);
}
