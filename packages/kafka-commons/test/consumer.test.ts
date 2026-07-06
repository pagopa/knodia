import { KafkaJS } from "@confluentinc/kafka-javascript";
import { pino } from "pino";
import { describe, expect, inject, it } from "vitest";
import { z } from "zod";

import type { KafkaConsumerConfig } from "../src/config/config.ts";

import { initKafkaAdmin } from "../src/admin.ts";
import { runConsumer } from "../src/consumer.ts";
import { initKafka } from "../src/kafka.ts";

declare module "vitest" {
  interface ProvidedContext {
    KAFKA_BROKER: string;
  }
}

const LOG_WAIT_TIMEOUT_MS = 30_000;

async function waitFor(predicate: () => boolean): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > LOG_WAIT_TIMEOUT_MS) {
      throw new Error("Timed out waiting for condition");
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

describe("runConsumer", () => {
  it(
    "logs message, stack and cause of the error thrown by the handler",
    { timeout: 60_000 },
    async () => {
      const randomId = crypto.randomUUID();
      const topicName = `test_kafka_commons_topic_${randomId}`;
      const config: KafkaConsumerConfig = {
        kafkaBrokers: inject("KAFKA_BROKER"),
        kafkaClientId: `test-client-${randomId}`,
        kafkaGroupId: `test-group-${randomId}`,
        kafkaLogLevel: KafkaJS.logLevel.NOTHING,
        mskAuth: undefined,
        topicStartingOffset: "earliest",
      };

      const logLines: string[] = [];
      const logger = pino(
        { level: "info" },
        {
          write: (line: string) => {
            logLines.push(line);
          },
        },
      );

      const kafka = await initKafka(config, logger);
      const admin = await initKafkaAdmin(kafka);
      await admin.createTopics({ topics: [{ topic: topicName }] });
      await admin.disconnect();

      const producer = kafka.producer();
      await producer.connect();
      await producer.send({
        messages: [{ value: "poison message" }],
        topic: topicName,
      });

      let disconnect: () => Promise<void> = () => Promise.resolve();
      await new Promise<void>((resolve) => {
        void runConsumer(
          [topicName],
          () =>
            Promise.reject(
              new Error("handler failed", {
                cause: new Error("the root cause"),
              }),
            ),
          config,
          logger,
          undefined,
          (dc) => {
            disconnect = dc;
            resolve();
          },
        );
      });

      try {
        await waitFor(() =>
          logLines.some((line) =>
            line.includes("Error handling Kafka message"),
          ),
        );
      } finally {
        await disconnect();
        await producer.disconnect();
      }

      const ErrorLogRecord = z.object({
        err: z.object({
          message: z.string(),
          stack: z.string(),
          type: z.string(),
        }),
        msg: z.string(),
      });

      const rawRecord = logLines.find((line) =>
        line.includes("Error handling Kafka message"),
      );
      expect(rawRecord).toBeDefined();
      const record = ErrorLogRecord.parse(JSON.parse(rawRecord ?? ""));

      expect(record.msg).toBe(
        `Error handling Kafka message. Topic: ${topicName}. Partition number: 0. Offset: 0`,
      );
      expect(record.err.type).toBe("Error");
      expect(record.err.message).toBe("handler failed: the root cause");
      expect(record.err.stack).toContain("Error: handler failed");
      expect(record.err.stack).toContain("caused by: Error: the root cause");
    },
  );
});
