import { ReadModelEserviceConfig } from "@knodia/db-readmodel-eservice/config";
import {
  EserviceTopicConfig,
  KafkaConsumerConfig,
} from "@knodia/kafka-commons/config";
import { z } from "zod";

export const EserviceReadModelWriterConfig =
  ReadModelEserviceConfig.and(KafkaConsumerConfig).and(EserviceTopicConfig);

export type EserviceReadModelWriterConfig = z.infer<
  typeof EserviceReadModelWriterConfig
>;

export const config: EserviceReadModelWriterConfig =
  EserviceReadModelWriterConfig.parse(process.env);
