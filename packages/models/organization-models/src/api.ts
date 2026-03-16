import { OrganizationId } from "@knodia/common-models/ids";
import z from "zod";

const minOrganizationNameLength = 1;

export const API_OrganizationIdPathParam = z.strictObject({
  organizationId: OrganizationId,
});
export type API_OrganizationIdPathParam = z.infer<
  typeof API_OrganizationIdPathParam
>;

export const API_CompactOrganization = z
  .strictObject({
    id: z.uuid(),
    name: z.string().min(minOrganizationNameLength),
  })
  .meta({
    description: "Organization with only id, and name",
    id: "CompactOrganization",
  });
