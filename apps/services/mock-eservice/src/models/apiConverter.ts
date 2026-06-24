import {
  type API_AsyncConsumptionRequestState,
  type API_GetCompanyAddressesRequestStateResponse,
} from "../models/api.ts";

export function toAPI_GetCompanyAddressesRequestStateResponse(
  state: API_AsyncConsumptionRequestState,
  resourceId: string | undefined,
): API_GetCompanyAddressesRequestStateResponse {
  return {
    resourceId,
    state,
  };
}
