import { randomUUID } from "crypto";

import {
  API_AsyncConsumptionRequestStatus,
  type API_GetCompanyAddressesRequestStatusResponse,
} from "../models/api.ts";

export function toAPI_GetCompanyAddressesRequestStatusResponse(
  requestStatus: boolean,
): API_GetCompanyAddressesRequestStatusResponse {
  return {
    resourceId: requestStatus ? randomUUID() : undefined,
    status: requestStatus
      ? API_AsyncConsumptionRequestStatus.enum.COMPLETED
      : API_AsyncConsumptionRequestStatus.enum.PENDING,
  };
}
