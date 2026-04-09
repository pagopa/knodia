import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    env: {
      AGREEMENT_PROCESS_URL: "http://localhost:0",
      AWS_ACCESS_KEY_ID: "test",
      AWS_ENDPOINT_URL_KMS: "http://localhost:0",
      AWS_ENDPOINT_URL_S3: "http://localhost:0",
      AWS_REGION: "eu-south-1",
      AWS_SECRET_ACCESS_KEY: "test",
      CALLER_KNODE_ID: "Lynx",
      ESERVICE_INTERFACES_S3_BUCKET: "test",
      ESERVICE_PROCESS_URL: "http://localhost:0",
      HOST: "0.0.0.0",
      INTERNAL_JWT_AUDIENCE: "test",
      INTERNAL_JWT_ISSUER: "test",
      INTERNAL_JWT_KID: "test",
      INTERNAL_JWT_SUBJECT: "test",
      KEYCHAIN_PROCESS_URL: "http://localhost:0",
      LOG_LEVEL: "silent",
      ORGANIZATION_PROCESS_URL: "http://localhost:0",
      PORT: "9999",
      PURPOSE_PROCESS_URL: "http://localhost:0",
    },
  },
});
