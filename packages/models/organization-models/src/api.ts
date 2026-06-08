import { OrganizationId } from "@knodia/common-models/ids";
import { API_KnodeId } from "@knodia/common-models/internalApi";
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
    knodeId: API_KnodeId,
    name: z.string().min(minOrganizationNameLength),
  })
  .meta({
    description: "Organization with only id, knodeId, and name",
    id: "CompactOrganization",
  });

export const API_CompactProducer = z
  .strictObject({
    id: z.uuid(),
    name: z.string().min(minOrganizationNameLength),
  })
  .meta({
    description:
      "Producer Organization with only id and name; its owning Knode is exposed via the resource-level knodeId",
    id: "CompactProducer",
  });
