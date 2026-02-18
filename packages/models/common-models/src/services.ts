import z from "zod";

export const ServiceName = z.enum([
  "backend-for-frontend",
  "eservice-process",
  "eservice-readmodel-writer",
]);
export type ServiceName = z.infer<typeof ServiceName>;

export const serviceCode: Record<ServiceName, string> = {
  "backend-for-frontend": "001",
  "eservice-process": "002",
  "eservice-readmodel-writer": "003",
};
