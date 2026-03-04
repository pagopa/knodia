import type {
  Consumer,
  EachMessagePayload,
} from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { Logger } from "pino";

import { kafkaMessageProcessError } from "@knodia/common-models/errors";

import type { KafkaConsumerConfig } from "./config/config.ts";

import { checkTopicsExist } from "./admin.ts";
import { initKafka } from "./kafka.ts";
import { errorEventsListener } from "./listeners.ts";
import { processExit } from "./utils/utils.ts";

export async function runConsumer(
  topics: string[],
  consumerHandler: (messagePayload: EachMessagePayload) => Promise<void>,
  config: KafkaConsumerConfig,
  logger: Logger,
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

    errorEventsListener(consumer, logger);

    await consumer.connect();
    logger.debug("Kafka consumer connected");

    const topicExists = await checkTopicsExist(kafka, topics, logger);
    if (!topicExists) {
      processExit({ logger });
    }

    await consumer.subscribe({ topics });
    logger.info(`Kafka subscribed to topics: ${topics}`);

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
    processExit({ logger });
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
