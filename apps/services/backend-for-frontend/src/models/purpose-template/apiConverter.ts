import type { PurposeTemplate } from "@knodia/purpose-template-models";

import type { API_PurposeTemplate, API_PurposeTemplateDetails } from "./api.ts";

export const toAPI_PurposeTemplate = (
  purposeTemplate: PurposeTemplate,
): API_PurposeTemplate => ({
  description: purposeTemplate.description,
  id: purposeTemplate.id,
  name: purposeTemplate.name,
});

export const toAPI_PurposeTemplateDetails = (
  purposeTemplate: PurposeTemplate,
): API_PurposeTemplateDetails => ({
  createdAt: purposeTemplate.createdAt.toISOString(),
  description: purposeTemplate.description,
  eserviceId: purposeTemplate.eserviceId,
  formAnswers: purposeTemplate.formAnswers,
  formSchemaVersion: purposeTemplate.formSchemaVersion,
  id: purposeTemplate.id,
  name: purposeTemplate.name,
});
