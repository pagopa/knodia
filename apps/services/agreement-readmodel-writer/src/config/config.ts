import { ReadmodelAgreementConfig } from "@knodia/db-readmodel-agreement/config";
import {
  AgreementTopicConfig,
  KafkaConsumerConfig,
} from "@knodia/kafka-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { type z } from "zod";

const AgreementReadmodelWriterConfig = LoggerConfig.and(
  ReadmodelAgreementConfig,
)
  .and(KafkaConsumerConfig)
  .and(AgreementTopicConfig);

type AgreementReadmodelWriterConfig = z.infer<
  typeof AgreementReadmodelWriterConfig
>;

export const config: AgreementReadmodelWriterConfig =
  AgreementReadmodelWriterConfig.parse(process.env);
