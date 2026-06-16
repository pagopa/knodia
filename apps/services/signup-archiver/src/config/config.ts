import {
  KafkaConsumerConfig,
  SignupTopicConfig,
} from "@knodia/kafka-commons/config";
import { LoggerConfig } from "@knodia/logger/config";
import { z } from "zod";

const SignupArchiverConfig = LoggerConfig.and(KafkaConsumerConfig)
  .and(SignupTopicConfig)
  .and(
    z
      .object({ SIGNUP_ARCHIVES_S3_BUCKET: z.string().min(1) })
      .transform((c) => ({
        signupArchivesS3Bucket: c.SIGNUP_ARCHIVES_S3_BUCKET,
      })),
  );
type SignupArchiverConfig = z.infer<typeof SignupArchiverConfig>;

export const config: SignupArchiverConfig = SignupArchiverConfig.parse(
  process.env,
);
