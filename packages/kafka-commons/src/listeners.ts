import type {
  Consumer,
  Producer,
} from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { Pool } from "pg";
import type { Logger } from "pino";

import { processExitAndDisconnect } from "./utils/utils.ts";

const errorTypes = ["unhandledRejection", "uncaughtException"];
const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];

export function errorEventsListener(
  consumerOrProducer: Consumer | Producer,
  logger: Logger,
  readmodelPool: Pool,
): void {
  errorTypes.forEach((type) => {
    process.on(
      type,
      async (e) =>
        await handleExit(e, type, consumerOrProducer, logger, readmodelPool),
    );
  });

  signalTraps.forEach((type) => {
    process.once(
      type,
      async () =>
        await handleExit(null, type, consumerOrProducer, logger, readmodelPool),
    );
  });
}

async function handleExit(
  e: unknown,
  type: string,
  consumerOrProducer: Consumer | Producer,
  logger: Logger,
  readmodelPool: Pool,
) {
  try {
    if (e) logger.error(`Error ${type} intercepted; Error detail: ${e}`);
    await consumerOrProducer.disconnect();
    logger.debug("Consumer/Producer disconnected successfully");
  } catch (err) {
    logger.error(`Error during disconnect on ${type}: ${err}`);
  } finally {
    await processExitAndDisconnect({ logger, readmodelPool });
  }
}
