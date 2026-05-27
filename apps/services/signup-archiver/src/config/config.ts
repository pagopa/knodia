import {
  KafkaConsumerConfig,
  SignupTopicConfig,
} from "@knodia/kafka-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { type z } from "zod";

const SignupArchiverConfig =
  LoggerConfig.and(KafkaConsumerConfig).and(SignupTopicConfig);
type SignupArchiverConfig = z.infer<typeof SignupArchiverConfig>;

export const config: SignupArchiverConfig = SignupArchiverConfig.parse(
  process.env,
);
