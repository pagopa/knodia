import { z } from "zod";

export const serviceName = {
  API_GATEWAY: "api-gateway",
  BACKEND_FOR_FRONTEND: "backend-for-frontend",
  ESERVICE_PROCESS: "eservice-process",
} as const;
export const ServiceName = z.enum(Object.values(serviceName));
export type ServiceName = z.infer<typeof ServiceName>;

export const serviceErrorCode: Record<ServiceName, string> = {
  [serviceName.API_GATEWAY]: "003",
  [serviceName.BACKEND_FOR_FRONTEND]: "001",
  [serviceName.ESERVICE_PROCESS]: "002",
};
