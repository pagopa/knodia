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
    description: "Organization with id, knodeId, and name",
    id: "CompactOrganization",
  });

export const API_CompactProducer = API_CompactOrganization.omit({
  knodeId: true,
}).meta({
  description:
    "Producer Organization with id and name; omits knodeId since it is always known from the resource this is embedded in",
  id: "CompactProducer",
});
