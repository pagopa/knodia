import type { Logger as KafkaLogger } from "@confluentinc/kafka-javascript/types/kafkajs.ts";
import type { LevelWithSilent, Logger } from "pino";

import { KafkaJS } from "@confluentinc/kafka-javascript";

const { logLevel } = KafkaJS;

// pino logger for the confluent client's `kafkaJS.logger`, so its logs come out as
// single-line JSON.
export function pinoKafkaLogger(logger: Logger): KafkaLogger {
  return buildAdapter(logger.child({ module: "kafka" }));
}

function buildAdapter(pinoLogger: Logger): KafkaLogger {
  const emit =
    (level: "debug" | "error" | "info" | "warn") =>
    (message: Error | string, extra?: object): void => {
      // Some call sites pass an Error where the type says string.
      const [msg, merge] =
        message instanceof Error
          ? [message.message, { ...extra, err: message }]
          : [message, extra];

      if (merge === undefined) pinoLogger[level](msg);
      else pinoLogger[level](merge, msg);
    };

  return {
    debug: emit("debug"),
    error: emit("error"),
    info: emit("info"),
    namespace: (namespace, level) => {
      const child = pinoLogger.child({ namespace });
      if (level !== undefined) child.level = pinoLevelByKafkaLevel[level];
      return buildAdapter(child);
    },
    setLogLevel: (level) => {
      pinoLogger.level = pinoLevelByKafkaLevel[level];
    },
    warn: emit("warn"),
  };
}

const pinoLevelByKafkaLevel: Record<KafkaJS.logLevel, LevelWithSilent> = {
  [logLevel.DEBUG]: "debug",
  [logLevel.ERROR]: "error",
  [logLevel.INFO]: "info",
  [logLevel.NOTHING]: "silent",
  [logLevel.WARN]: "warn",
};
