import { ReadmodelPurposeConfig } from "@knodia/db-readmodel-purpose/config";
import {
  KafkaConsumerConfig,
  PurposeTopicConfig,
} from "@knodia/kafka-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { type z } from "zod";

const PurposeReadmodelWriterConfig = LoggerConfig.and(ReadmodelPurposeConfig)
  .and(KafkaConsumerConfig)
  .and(PurposeTopicConfig);

type PurposeReadmodelWriterConfig = z.infer<
  typeof PurposeReadmodelWriterConfig
>;

export const config: PurposeReadmodelWriterConfig =
  PurposeReadmodelWriterConfig.parse(process.env);
