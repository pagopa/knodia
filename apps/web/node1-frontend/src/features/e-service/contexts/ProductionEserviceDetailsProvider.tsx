import type { Eservice } from "@knodia/bff-client";

import { ProductionEserviceDetailsContext } from "./useProductionEserviceDetailsContext";

export function ProductionEserviceDetailsProvider({
  children,
  eservice,
}: {
  children: React.ReactNode;
  eservice: Eservice;
}) {
  return (
    <ProductionEserviceDetailsContext.Provider value={{ eservice }}>
      {children}
    </ProductionEserviceDetailsContext.Provider>
  );
}
