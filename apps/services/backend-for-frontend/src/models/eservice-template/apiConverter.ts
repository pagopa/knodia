import type { EserviceTemplate } from "@knodia/eservice-template-models";

import type {
  API_EserviceTemplate,
  API_EserviceTemplateDetails,
} from "./api.ts";

export const toAPI_EserviceTemplateDetails = (
  eserviceTemplate: EserviceTemplate,
): API_EserviceTemplateDetails => ({
  categories: eserviceTemplate.categories,
  createdAt: eserviceTemplate.createdAt.toISOString(),
  description: eserviceTemplate.description,
  id: eserviceTemplate.id,
  interfaceDocument: eserviceTemplate.interfaceDocument,
  mode: eserviceTemplate.mode,
  name: eserviceTemplate.name,
  requiredAttributes: eserviceTemplate.requiredAttributes,
});

export const toAPI_EserviceTemplate = (
  eserviceTemplate: EserviceTemplate,
): API_EserviceTemplate => ({
  description: eserviceTemplate.description,
  id: eserviceTemplate.id,
  name: eserviceTemplate.name,
});
