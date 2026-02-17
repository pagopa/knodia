import type { ProducerEserviceDetails } from "@knodia/bff-client";

import { createContext, useContext } from "react";

export const ProductionEserviceDetailsContext =
  createContext<null | ProducerEserviceDetails>(null);

export function useProductionEserviceDetailsContext() {
  const ctx = useContext(ProductionEserviceDetailsContext);
  if (!ctx) {
    throw new Error(
      "useProductionEserviceDetailsContext must be used within ProductionEserviceDetailsProvider",
    );
  }
  return ctx;
}
