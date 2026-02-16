import type { EserviceDetails } from "@knodia/bff-client";

import { createContext, useContext } from "react";

type ProductionEserviceDetailsContextValue = EserviceDetails;

export const ProductionEserviceDetailsContext =
  createContext<null | ProductionEserviceDetailsContextValue>(null);

export function useProductionEserviceDetailsContext() {
  const ctx = useContext(ProductionEserviceDetailsContext);
  if (!ctx) {
    throw new Error(
      "useProductionEserviceDetailsContext must be used within ProductionEserviceDetailsProvider",
    );
  }
  return ctx;
}
