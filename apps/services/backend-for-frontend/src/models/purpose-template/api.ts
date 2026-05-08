import { API_KnodeId } from "@knodia/common-models/internalApi";
import {
  API_LocalizedPurposeDescription,
  API_LocalizedPurposeName,
  API_PurposeFormAnswers,
  API_PurposeFormSchemaVersion,
} from "@knodia/purpose-models/api";
import { z } from "zod";

export const API_PurposeTemplate = z
  .strictObject({
    description: API_LocalizedPurposeDescription,
    eserviceId: z.uuid().optional(),
    id: z.uuid(),
    name: API_LocalizedPurposeName,
  })
  .meta({ id: "PurposeTemplate" });
export type API_PurposeTemplate = z.infer<typeof API_PurposeTemplate>;

export const API_PurposeTemplateDetails = z
  .strictObject({
    createdAt: z.iso.datetime(),
    description: API_LocalizedPurposeDescription,
    eserviceId: z.uuid().optional(),
    formAnswersJson: API_PurposeFormAnswers,
    formSchemaVersion: API_PurposeFormSchemaVersion,
    id: z.uuid(),
    name: API_LocalizedPurposeName,
  })
  .meta({ id: "PurposeTemplateDetails" });
export type API_PurposeTemplateDetails = z.infer<
  typeof API_PurposeTemplateDetails
>;

export const API_PurposeTemplates = z
  .array(API_PurposeTemplate)
  .meta({ id: "PurposeTemplates" });
export type API_PurposeTemplates = z.infer<typeof API_PurposeTemplates>;

export const API_GetPurposeTemplatesQueryParams = z.strictObject({
  eserviceId: z.uuid().optional(),
  knodeId: API_KnodeId,
});
export type API_GetPurposeTemplatesQueryParams = z.infer<
  typeof API_GetPurposeTemplatesQueryParams
>;

export const API_GetPurposeTemplateQueryParams = z.strictObject({
  knodeId: API_KnodeId,
});
export type API_GetPurposeTemplateQueryParams = z.infer<
  typeof API_GetPurposeTemplateQueryParams
>;

export const API_PurposeTemplateIdPathParam = z.strictObject({
  purposeTemplateId: z.uuid(),
});
export type API_PurposeTemplateIdPathParam = z.infer<
  typeof API_PurposeTemplateIdPathParam
>;
