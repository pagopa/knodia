import type { Kafka } from "@confluentinc/kafka-javascript/types/kafkajs.js";
import type { Logger } from "pino";

export async function validateTopicMetadata(
  kafka: Kafka,
  topicNames: string[],
  logger: Logger,
): Promise<boolean> {
  logger.debug(`Check topics [${topicNames}] existence...`);

  const admin = await initKafkaAdmin(kafka);

  try {
    const { topics } = await admin.fetchTopicMetadata({
      topics: [...topicNames],
    });
    logger.debug(`Topic metadata: ${JSON.stringify(topics)} `);
    return true;
  } catch (e) {
    logger.error(
      `Unable to subscribe to topics "${topicNames}"! Error during topic metadata fetch: ${JSON.stringify(
        e,
      )}`,
    );
    return false;
  } finally {
    await admin.disconnect();
  }
}

async function initKafkaAdmin(kafka: Kafka) {
  const admin = kafka.admin();
  await admin.connect();
  return admin;
}
