import type { Eservice } from "@knodia/bff-client";

import { createContext, useContext } from "react";

interface ProductionEserviceDetailsContextValue {
  eservice: Eservice;
}

export const ProductionEserviceDetailsContext =
  createContext<null | ProductionEserviceDetailsContextValue>(null);

/**
 * @beta not in use yet, will be used to share the Eservice details across the tabs in the details page
 */
export function useProductionEserviceDetailsContext() {
  const ctx = useContext(ProductionEserviceDetailsContext);
  if (!ctx) {
    throw new Error(
      "useProductionEserviceDetailsContext must be used within ProductionEserviceDetailsProvider",
    );
  }
  return ctx;
}
