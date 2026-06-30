import {
  asyncCompanyAddressesRequests,
  asyncCompanyAddressesResults,
} from "../../src/asyncConsumption/asyncConsumptionRequests.ts";

export function resetAsyncCompanyAddressesMaps(): void {
  asyncCompanyAddressesRequests.clear();
  asyncCompanyAddressesResults.clear();
}
