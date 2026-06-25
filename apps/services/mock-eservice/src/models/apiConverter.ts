import type {
  API_AsyncConsumptionRequestState,
  API_GetCompanyAddressesRequestStateResponse,
} from "./api.ts";

export function toAPI_GetCompanyAddressesRequestStateResponse(
  state: API_AsyncConsumptionRequestState,
  resourceId: string | undefined,
): API_GetCompanyAddressesRequestStateResponse {
  return {
    resourceId,
    state,
  };
}
