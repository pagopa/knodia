import z from "zod";

export const HTTPServiceName = z.enum([
  "backend-for-frontend",
  "eservice-process",
  "k2k-gateway",
  "remote-resources-manager",
  "agreement-process",
  "keychain-process",
  "organization-process",
]);
export type HTTPServiceName = z.infer<typeof HTTPServiceName>;

export type ServiceName = HTTPServiceName | KafkaConsumerServiceName;

const KafkaConsumerServiceName = z.enum([
  "eservice-readmodel-writer",
  "agreement-readmodel-writer",
  "keychain-readmodel-writer",
  "organization-readmodel-writer",
]);
type KafkaConsumerServiceName = z.infer<typeof KafkaConsumerServiceName>;
