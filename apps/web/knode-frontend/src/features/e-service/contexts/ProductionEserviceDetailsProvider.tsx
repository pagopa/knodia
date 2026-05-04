import { type bffApi } from "@knodia/bff-client";

import { ProductionEserviceDetailsContext } from "./useProductionEserviceDetailsContext";

export function ProductionEserviceDetailsProvider({
  children,
  eservice,
}: {
  children: React.ReactNode;
  eservice: bffApi.ProducerEserviceDetails;
}) {
  return (
    <ProductionEserviceDetailsContext.Provider value={eservice}>
      {children}
    </ProductionEserviceDetailsContext.Provider>
  );
}
