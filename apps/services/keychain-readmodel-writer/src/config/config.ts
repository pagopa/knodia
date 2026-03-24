import { ReadmodelKeychainConfig } from "@knodia/db-readmodel-keychain/config";
import {
  KafkaConsumerConfig,
  KeychainTopicConfig,
} from "@knodia/kafka-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { type z } from "zod";

const KeychainReadmodelWriterConfig = LoggerConfig.and(ReadmodelKeychainConfig)
  .and(KafkaConsumerConfig)
  .and(KeychainTopicConfig);

type KeychainReadmodelWriterConfig = z.infer<
  typeof KeychainReadmodelWriterConfig
>;

export const config: KeychainReadmodelWriterConfig =
  KeychainReadmodelWriterConfig.parse(process.env);
