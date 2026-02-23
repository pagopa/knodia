import z from "zod";

export const HTTPServiceName = z.enum([
  "backend-for-frontend",
  "eservice-process",
  "k2k-gateway",
]);
export type HTTPServiceName = z.infer<typeof HTTPServiceName>;

export const KafkaConsumerServiceName = z.enum(["eservice-readmodel-writer"]);
export type KafkaConsumerServiceName = z.infer<typeof KafkaConsumerServiceName>;

export type ServiceName = HTTPServiceName | KafkaConsumerServiceName;
