import type { EserviceTemplate } from "@knodia/eservice-template-models";

import type {
  API_EserviceTemplate,
  API_EserviceTemplateDetails,
} from "./api.ts";

export const toAPI_EserviceTemplateDetails = (
  eserviceTemplate: EserviceTemplate,
): API_EserviceTemplateDetails => ({
  createdAt: eserviceTemplate.createdAt.toISOString(),
  description: eserviceTemplate.description,
  eserviceFields: {
    categories: eserviceTemplate.eserviceFields.categories,
    interfaceDocument: eserviceTemplate.eserviceFields.interfaceDocument,
    mode: eserviceTemplate.eserviceFields.mode,
    requiredAttributes: eserviceTemplate.eserviceFields.requiredAttributes,
  },
  id: eserviceTemplate.id,
  name: eserviceTemplate.name,
});

export const toAPI_EserviceTemplate = (
  eserviceTemplate: EserviceTemplate,
): API_EserviceTemplate => ({
  description: eserviceTemplate.description,
  id: eserviceTemplate.id,
  name: eserviceTemplate.name,
});
