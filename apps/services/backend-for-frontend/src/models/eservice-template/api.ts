import { API_Attribute } from "@knodia/attribute-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import {
  API_EserviceCategory,
  API_EserviceMode,
  API_LocalizedDescription,
  API_LocalizedInterfacePrettyName,
  API_LocalizedName,
} from "@knodia/eservice-models/api";
import { z } from "zod";

const API_EserviceTemplateInterface = z
  .strictObject({
    contentType: z.string(),
    name: z.string(),
    prettyName: API_LocalizedInterfacePrettyName,
  })
  .meta({ id: "EserviceTemplateInterface" });

export const API_EserviceTemplateDetails = z
  .strictObject({
    categories: z.array(API_EserviceCategory),
    createdAt: z.iso.datetime(),
    description: API_LocalizedDescription,
    id: z.uuid(),
    interfaceDocument: API_EserviceTemplateInterface,
    mode: API_EserviceMode,
    name: API_LocalizedName,
    requiredAttributes: z.array(z.array(API_Attribute)),
  })
  .meta({ id: "EserviceTemplateDetails" });
export type API_EserviceTemplateDetails = z.infer<
  typeof API_EserviceTemplateDetails
>;

export const API_EserviceTemplate = z
  .strictObject({
    description: API_LocalizedDescription,
    id: z.uuid(),
    name: API_LocalizedName,
  })
  .meta({ id: "EserviceTemplate" });
export type API_EserviceTemplate = z.infer<typeof API_EserviceTemplate>;

export const API_GetEserviceTemplatesQueryParams = z.strictObject({
  knodeId: API_KnodeId,
});
export type API_GetEserviceTemplatesQueryParams = z.infer<
  typeof API_GetEserviceTemplatesQueryParams
>;

export const API_GetEserviceTemplateQueryParams = z.strictObject({
  knodeId: API_KnodeId,
});
export type API_GetEserviceTemplateQueryParams = z.infer<
  typeof API_GetEserviceTemplateQueryParams
>;

export const API_EserviceTemplateIdPathParam = z.strictObject({
  templateId: z.uuid(),
});
export type API_EserviceTemplateIdPathParam = z.infer<
  typeof API_EserviceTemplateIdPathParam
>;

export const API_EserviceTemplates = z
  .array(API_EserviceTemplate)
  .meta({ id: "EserviceTemplates" });
export type API_EserviceTemplates = z.infer<typeof API_EserviceTemplates>;
