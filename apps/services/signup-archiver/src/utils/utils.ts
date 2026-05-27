import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { Logger } from "pino";

import { handleSignupMessage } from "../services/consumerService.ts";

export const createProcessMessage = (logger: Logger) =>
  async function processMessage({
    message,
    partition,
  }: EachMessagePayload): Promise<void> {
    await handleSignupMessage();

    logger.info(
      `Signup message processed. Partition number: ${partition}. Offset: ${message.offset}`,
    );
  };
