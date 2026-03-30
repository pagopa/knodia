import type {
  Consumer,
  EachMessagePayload,
} from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { Pool } from "pg";
import type { Logger } from "pino";

import { kafkaMessageProcessError } from "@knodia/common-models/errors";

import type { KafkaConsumerConfig } from "./config/config.ts";

import { checkTopicsExist } from "./admin.ts";
import { initKafka } from "./kafka.ts";
import { errorEventsListener } from "./listeners.ts";
import { processExitAndDisconnect } from "./utils/utils.ts";

/**
 * Starts a Kafka consumer and processes messages from the provided topics.
 *
 * The consumer connects, verifies the topics exist, subscribes, and then
 * runs `consumerHandler` for each message. Offsets are committed only after
 * successful processing.
 *
 * @param topics - Kafka topics to subscribe to.
 * @param consumerHandler - Function invoked for each consumed message.
 * @param config - Kafka consumer configuration.
 * @param logger - Logger used for consumer events and errors.
 * @param readmodelPool - Database pool used for shutdown handling.
 * @param onReady - Optional callback invoked once the consumer is connected
 * and subscribed. Receives a `disconnect` function to gracefully stop the consumer.
 */
export async function runConsumer(
  topics: string[],
  consumerHandler: (messagePayload: EachMessagePayload) => Promise<void>,
  config: KafkaConsumerConfig,
  logger: Logger,
  readmodelPool: Pool,
  onReady?: (disconnect: () => Promise<void>) => void,
) {
  try {
    logger.debug(`Kafka consumer connecting to topics: ${topics}`);
    const kafka = await initKafka(config, logger);

    const consumer = kafka.consumer({
      "auto.offset.reset": config.topicStartingOffset,
      "enable.auto.commit": false,
      "group.id": config.kafkaGroupId,
      "retry.backoff.max.ms": 3000,
    });

    errorEventsListener(consumer, logger, readmodelPool);

    await consumer.connect();
    logger.debug("Kafka consumer connected");

    const topicExists = await checkTopicsExist(kafka, topics, logger);
    if (!topicExists) {
      await processExitAndDisconnect({ logger, readmodelPool });
    }

    await consumer.subscribe({ topics });
    logger.info(`Kafka subscribed to topics: ${topics}`);

    onReady?.(() => consumer.disconnect());

    await consumer.run({
      eachMessage: async (payload: EachMessagePayload): Promise<void> => {
        try {
          await consumerHandler(payload);
          await kafkaCommitMessageOffsets(consumer, payload, logger);
        } catch (e) {
          const kafkaMessageProcessErr = kafkaMessageProcessError(
            payload.topic,
            payload.partition,
            payload.message.offset,
          );
          logger.error({ e }, kafkaMessageProcessErr.detail);

          throw kafkaMessageProcessErr;
        }
      },
    });
  } catch (e) {
    logger.error(`Generic error occurs during consumer initialization: ${e}`);
    await processExitAndDisconnect({ logger, readmodelPool });
  }
}

async function kafkaCommitMessageOffsets(
  consumer: Consumer,
  payload: EachMessagePayload,
  logger: Logger,
): Promise<void> {
  const { message, partition, topic } = payload;
  await consumer.commitOffsets([
    { offset: (Number(message.offset) + 1).toString(), partition, topic },
  ]);

  logger.debug(`Topic message offset ${Number(message.offset) + 1} committed`);
}
