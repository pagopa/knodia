import { ReadmodelConsumerKeychainConfig } from "@knodia/db-readmodel-consumer-keychain/config";
import {
  KafkaConsumerConfig,
  KeychainTopicConfig,
} from "@knodia/kafka-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const KeychainReadmodelWriterConfig = LoggerConfig.and(
  ReadmodelConsumerKeychainConfig,
)
  .and(KafkaConsumerConfig)
  .and(KeychainTopicConfig);

type KeychainReadmodelWriterConfig = z.infer<
  typeof KeychainReadmodelWriterConfig
>;

export const config: KeychainReadmodelWriterConfig =
  KeychainReadmodelWriterConfig.parse(process.env);
