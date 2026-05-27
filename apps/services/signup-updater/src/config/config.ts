import {
  KafkaConsumerConfig,
  SignupTopicConfig,
} from "@knodia/kafka-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { type z } from "zod";

const SignupUpdaterConfig =
  LoggerConfig.and(KafkaConsumerConfig).and(SignupTopicConfig);
type SignupUpdaterConfig = z.infer<typeof SignupUpdaterConfig>;

export const config: SignupUpdaterConfig = SignupUpdaterConfig.parse(
  process.env,
);
