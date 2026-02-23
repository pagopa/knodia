import z from "zod";

export const HTTPServiceName = z.enum([
  "backend-for-frontend",
  "eservice-process",
  "k2k-gateway",
]);
export type HTTPServiceName = z.infer<typeof HTTPServiceName>;

export type ServiceName = HTTPServiceName | KafkaConsumerServiceName;

const KafkaConsumerServiceName = z.enum(["eservice-readmodel-writer"]);
type KafkaConsumerServiceName = z.infer<typeof KafkaConsumerServiceName>;
