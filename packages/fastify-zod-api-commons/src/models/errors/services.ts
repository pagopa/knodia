import { z } from "zod";

export const serviceName = {
  BACKEND_FOR_FRONTEND: "backend-for-frontend",
  ESERVICE_PROCESS: "eservice-process",
  KNODIA_API_GATEWAY: "knodia-api-gateway",
  REMOTE_RESOURCES_MANAGER: "remote-resources-manager",
} as const;
export const ServiceName = z.enum(Object.values(serviceName));
export type ServiceName = z.infer<typeof ServiceName>;

export const serviceErrorCode: Record<ServiceName, string> = {
  [serviceName.BACKEND_FOR_FRONTEND]: "001",
  [serviceName.ESERVICE_PROCESS]: "002",
  [serviceName.KNODIA_API_GATEWAY]: "003",
  [serviceName.REMOTE_RESOURCES_MANAGER]: "004",
};
