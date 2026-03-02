import { ReadmodelConsumerKeychainConfig } from "@knodia/db-readmodel-consumer-keychain/config";
import {
  ConsumerKeychainTopicConfig,
  KafkaConsumerConfig,
} from "@knodia/kafka-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const ConsumerKeychainReadmodelWriterConfig = LoggerConfig.and(
  ReadmodelConsumerKeychainConfig,
)
  .and(KafkaConsumerConfig)
  .and(ConsumerKeychainTopicConfig);

type ConsumerKeychainReadmodelWriterConfig = z.infer<
  typeof ConsumerKeychainReadmodelWriterConfig
>;

export const config: ConsumerKeychainReadmodelWriterConfig =
  ConsumerKeychainReadmodelWriterConfig.parse(process.env);
