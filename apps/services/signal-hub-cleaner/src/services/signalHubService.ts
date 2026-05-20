import { signalHubDbServiceBuilder } from "@knodia/db-signal-hub/services";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { type Logger } from "pino";

export type SignalHubService = ReturnType<typeof signalHubServiceBuilder>;

export function signalHubServiceBuilder(
  signalHubDb: NodePgDatabase,
  logger: Logger,
) {
  const signalHubDbService = signalHubDbServiceBuilder(signalHubDb);

  return {
    async cleanup(signalsRetentionHours: number) {
      logger.info(
        `Signals cleanup started with retention hours: ${signalsRetentionHours}`,
      );
      const currentDate = new Date();
      const cutoffDate = new Date(
        currentDate.getTime() - signalsRetentionHours * 60 * 60 * 1000,
      );
      logger.info(
        `Signals cleanup current date: ISO [${currentDate.toISOString()}], UTC: [${currentDate.toUTCString()}], LOCAL: [${currentDate.toLocaleString()}]`,
      );
      logger.info(
        `Signals cleanup date limit:  ISO [${cutoffDate.toISOString()}], UTC: [${cutoffDate.toUTCString()}], LOCAL: [${cutoffDate.toLocaleString()}]`,
      );

      let deletedSignalsCount = 0;
      try {
        deletedSignalsCount =
          await signalHubDbService.deleteSignals(cutoffDate);
      } catch (error) {
        console.log("Error during signals cleanup:", error);
        throw error;
      }

      logger.info(`Signals cleanup deleted ${deletedSignalsCount} signals`);
    },
  };
}
