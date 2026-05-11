import { API_AgreementState } from "@knodia/agreement-models/api";
import { KnodeId } from "@knodia/common-models/ids";
import { z } from "zod";

import { config } from "@/config/config";

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

export const consumptionEserviceSearchDefaultValues = {
  category: "",
  keywords: "",
  knodeId: "",
  offset: 0,
};

export const consumptionEserviceSearchSchema = z.object({
  category: z
    .string()
    .default(consumptionEserviceSearchDefaultValues.category)
    .catch(consumptionEserviceSearchDefaultValues.category),
  keywords: z
    .string()
    .default(consumptionEserviceSearchDefaultValues.keywords)
    .catch(consumptionEserviceSearchDefaultValues.keywords),
  knodeId: z
    .string()
    .default(consumptionEserviceSearchDefaultValues.knodeId)
    .catch(consumptionEserviceSearchDefaultValues.knodeId),
  offset: z
    .number()
    .min(0)
    .default(consumptionEserviceSearchDefaultValues.offset)
    .catch(consumptionEserviceSearchDefaultValues.offset),
});

export type ConsumptionEserviceSearchParams = z.infer<
  typeof consumptionEserviceSearchSchema
>;

export const consumptionEserviceListDefaultValues = {
  agreementState: undefined,
  offset: 0,
} as const;

export const consumptionEserviceListSchema = z.object({
  agreementState: z
    .enum([
      API_AgreementState.enum.Active,
      API_AgreementState.enum.Suspended,
      API_AgreementState.enum.PendingConsumerOperatorIdentification,
    ])
    .optional()
    .catch(consumptionEserviceListDefaultValues.agreementState),
  offset: z
    .number()
    .min(0)
    .default(consumptionEserviceListDefaultValues.offset)
    .catch(consumptionEserviceListDefaultValues.offset),
});

export type ConsumptionEserviceListParams = z.infer<
  typeof consumptionEserviceListSchema
>;

export const eserviceDetailSearchSchema = z.object({
  knodeId: KnodeId,
});

export const eserviceTemplateSearchDefaultValues = {
  category: "",
  knodeId: config.knodeId,
  templateId: undefined,
};

export const eserviceTemplateSearchSchema = z.object({
  category: z
    .string()
    .default(eserviceTemplateSearchDefaultValues.category)
    .catch(eserviceTemplateSearchDefaultValues.category),
  knodeId: KnodeId.default(eserviceTemplateSearchDefaultValues.knodeId).catch(
    eserviceTemplateSearchDefaultValues.knodeId,
  ),
  templateId: z
    .string()
    .optional()
    .catch(eserviceTemplateSearchDefaultValues.templateId),
});
