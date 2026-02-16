import type { EserviceDetails } from "@knodia/bff-client";

import { ProductionEserviceDetailsContext } from "./useProductionEserviceDetailsContext";

export function ProductionEserviceDetailsProvider({
  children,
  eservice,
}: {
  children: React.ReactNode;
  eservice: EserviceDetails;
}) {
  return (
    <ProductionEserviceDetailsContext.Provider value={eservice}>
      {children}
    </ProductionEserviceDetailsContext.Provider>
  );
}
