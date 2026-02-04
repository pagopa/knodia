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
    .catch(productionEserviceSearchDefaultValues.dataMode),
  offset: z.number().min(0).catch(productionEserviceSearchDefaultValues.offset),
  orderBy: z
    .enum(["name", "agreementsCount", "purposesCount"])
    .catch(productionEserviceSearchDefaultValues.orderBy),
  q: z.string().catch(productionEserviceSearchDefaultValues.q),
  status: z
    .enum(["active", "inactive", "all"])
    .catch(productionEserviceSearchDefaultValues.status),
});

export type ProductionEserviceSearchParams = z.infer<
  typeof productionEserviceSearchSchema
>;
