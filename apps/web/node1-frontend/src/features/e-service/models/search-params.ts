import { z } from "zod";

export const productionEserviceSearchDefaultValues = {
  dataMode: "all",
  offset: 0,
  orderBy: "name",
  q: "",
  status: "all",
} as const;

export const productionEserviceSearchSchema = z.object({
  dataMode: z
    .enum(["consume", "provide", "all"])
    .default(productionEserviceSearchDefaultValues.dataMode)
    .catch(productionEserviceSearchDefaultValues.dataMode),
  offset: z
    .number()
    .min(0)
    .default(productionEserviceSearchDefaultValues.offset)
    .catch(productionEserviceSearchDefaultValues.offset),
  orderBy: z
    .enum(["name", "agreementsCount", "purposesCount"])
    .default(productionEserviceSearchDefaultValues.orderBy)
    .catch(productionEserviceSearchDefaultValues.orderBy),
  q: z
    .string()
    .default(productionEserviceSearchDefaultValues.q)
    .catch(productionEserviceSearchDefaultValues.q),
  status: z
    .enum(["active", "inactive", "all"])
    .default(productionEserviceSearchDefaultValues.status)
    .catch(productionEserviceSearchDefaultValues.status),
});

export type ProductionEserviceSearchParams = z.infer<
  typeof productionEserviceSearchSchema
>;

const consumptionEserviceSearchDefaultValues = {
  category: "",
  keywords: "",
  knode: "",
  offset: 0,
} as const;

export const consumptionEserviceSearchSchema = z.object({
  category: z
    .string()
    .default(consumptionEserviceSearchDefaultValues.category)
    .catch(consumptionEserviceSearchDefaultValues.category),
  keywords: z
    .string()
    .default(consumptionEserviceSearchDefaultValues.keywords)
    .catch(consumptionEserviceSearchDefaultValues.keywords),
  knode: z
    .string()
    .default(consumptionEserviceSearchDefaultValues.knode)
    .catch(consumptionEserviceSearchDefaultValues.knode),
  offset: z
    .number()
    .min(0)
    .default(consumptionEserviceSearchDefaultValues.offset)
    .catch(consumptionEserviceSearchDefaultValues.offset),
});

export type ConsumptionEserviceSearchParams = z.infer<
  typeof consumptionEserviceSearchSchema
>;
