import { ReadmodelOrganizationConfig } from "@knodia/db-readmodel-organization/config";
import {
  KafkaConsumerConfig,
  OrganizationTopicConfig,
} from "@knodia/kafka-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const OrganizationReadmodelWriterConfig = LoggerConfig.and(
  ReadmodelOrganizationConfig,
)
  .and(KafkaConsumerConfig)
  .and(OrganizationTopicConfig);

type OrganizationReadmodelWriterConfig = z.infer<
  typeof OrganizationReadmodelWriterConfig
>;

export const config: OrganizationReadmodelWriterConfig =
  OrganizationReadmodelWriterConfig.parse(process.env);
