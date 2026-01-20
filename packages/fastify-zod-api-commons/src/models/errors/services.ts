import { z } from "zod";

export const serviceName = {
  BACKEND_FOR_FRONTEND: "backend-for-frontend",
  ESERVICE_PROCESS: "eservice-process",
} as const;
export const ServiceName = z.enum(Object.values(serviceName));
export type ServiceName = z.infer<typeof ServiceName>;

export const serviceErrorCode: Record<ServiceName, string> = {
  [serviceName.BACKEND_FOR_FRONTEND]: "002",
  [serviceName.ESERVICE_PROCESS]: "001",
};
