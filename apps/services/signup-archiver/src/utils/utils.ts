import type { EachMessagePayload } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { Logger } from "pino";

import { genericInternalError } from "@knodia/common-models/errors";
import { SignupEventV1 } from "@knodia/signup-models";

import {
  handleSignupMessage,
  type SignupArchiverDeps,
} from "../services/consumerService.ts";

export const createProcessMessage = (
  deps: SignupArchiverDeps,
  logger: Logger,
) =>
  async function processMessage({
    message,
    partition,
  }: EachMessagePayload): Promise<void> {
    if (!message.value) {
      throw genericInternalError("Empty Kafka message value");
    }

    const event = SignupEventV1.parse(JSON.parse(message.value.toString()));

    await handleSignupMessage(event, deps, logger);

    logger.info(
      `Signup message processed. Type: ${event.type}. Partition number: ${partition}. Offset: ${message.offset}`,
    );
  };
