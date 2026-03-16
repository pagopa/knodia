import { OrganizationId } from "@knodia/common-models/ids";
import z from "zod";

export const minOrganizationNameLength = 1;

export const API_OrganizationIdPathParam = z.strictObject({
  organizationId: OrganizationId,
});
export type API_OrganizationIdPathParam = z.infer<
  typeof API_OrganizationIdPathParam
>;
