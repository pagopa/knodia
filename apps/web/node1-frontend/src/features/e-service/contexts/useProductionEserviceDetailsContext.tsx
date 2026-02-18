import { bffApi } from "@knodia/bff-client";
import { createContext, useContext } from "react";

interface ProductionEserviceDetailsContextValue {
  eservice: bffApi.ProducerEserviceDetails;
}

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
