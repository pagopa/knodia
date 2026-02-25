import type {
  Consumer,
  Producer,
} from "@confluentinc/kafka-javascript/types/kafkajs.js";
import type { Logger } from "pino";

import { processExit } from "./utils/utils.ts";

const errorTypes = ["unhandledRejection", "uncaughtException"];
const signalTraps = ["SIGTERM", "SIGINT", "SIGUSR2"];

export function errorEventsListener(
  consumerOrProducer: Consumer | Producer,
  logger: Logger,
): void {
  errorTypes.forEach((type) => {
    process.on(type, async (e) => {
      try {
        logger.error(`Error ${type} intercepted; Error detail: ${e}`);
        await consumerOrProducer.disconnect().then(() => {
          logger.debug("Disconnected successfully");
        });
      } catch (e) {
        logger.error(
          `Unexpected error on disconnection with event type ${type}; Error detail: ${e}`,
        );
      } finally {
        processExit({ logger });
      }
    });
  });

  signalTraps.forEach((type) => {
    process.once(type, async () => {
      try {
        await consumerOrProducer.disconnect();
        logger.debug("Disconnected successfully");
      } catch (err) {
        logger.error(`Error during disconnect on ${type}: ${err}`);
      } finally {
        processExit({ logger });
      }
    });
  });
}
