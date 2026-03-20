import { API_Attribute } from "@knodia/attribute-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import z from "zod";

export const API_Organization = z
  .strictObject({
    attributes: z.array(API_Attribute),
    id: z.uuid(),
    name: z.string(),
  })
  .meta({ id: "Organization" });
export type API_Organization = z.infer<typeof API_Organization>;

export const API_GetOrganizationQueryParams = z.strictObject({
  knodeId: API_KnodeId,
});
export type API_GetOrganizationQueryParams = z.infer<
  typeof API_GetOrganizationQueryParams
>;
