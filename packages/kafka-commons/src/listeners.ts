import type {
  Consumer,
  Producer,
} from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { Logger } from "pino";

import { processExitAndDisconnect } from "./utils/utils.ts";

const errorTypes = ["unhandledRejection", "uncaughtException"];
const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];

export function errorEventsListener(
  consumerOrProducer: Consumer | Producer,
  logger: Logger,
  onShutdown?: () => Promise<void>,
): void {
  errorTypes.forEach((type) => {
    process.on(
      type,
      async (e) =>
        await handleExit(e, type, consumerOrProducer, logger, onShutdown),
    );
  });

  signalTraps.forEach((type) => {
    process.once(
      type,
      async () =>
        await handleExit(null, type, consumerOrProducer, logger, onShutdown),
    );
  });
}

async function handleExit(
  e: unknown,
  type: string,
  consumerOrProducer: Consumer | Producer,
  logger: Logger,
  onShutdown?: () => Promise<void>,
) {
  try {
    if (e) logger.error({ err: e }, `Error ${type} intercepted`);
    await consumerOrProducer.disconnect();
    logger.debug("Consumer/Producer disconnected successfully");
  } catch (err) {
    logger.error({ err }, `Error during disconnect on ${type}`);
  } finally {
    await processExitAndDisconnect({ logger, onShutdown });
  }
}
