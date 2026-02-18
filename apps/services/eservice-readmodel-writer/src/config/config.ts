import { ReadmodelEserviceConfig } from "@knodia/db-readmodel-eservice/config";
import {
  EserviceTopicConfig,
  KafkaConsumerConfig,
} from "@knodia/kafka-commons/config";
import { z } from "zod";

const EserviceReadmodelWriterConfig =
  ReadmodelEserviceConfig.and(KafkaConsumerConfig).and(EserviceTopicConfig);

type EserviceReadmodelWriterConfig = z.infer<
  typeof EserviceReadmodelWriterConfig
>;

export const config: EserviceReadmodelWriterConfig =
  EserviceReadmodelWriterConfig.parse(process.env);
