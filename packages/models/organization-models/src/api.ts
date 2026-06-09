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

const API_CompactOrganization = z
  .strictObject({
    id: z.uuid(),
    knodeId: API_KnodeId,
    name: z.string().min(minOrganizationNameLength),
  })
  .meta({
    description: "Organization with id, knodeId, and name",
    id: "CompactOrganization",
  });

// knodeId omitted: already exposed at the resource level.
export const API_CompactProducer = API_CompactOrganization.omit({
  knodeId: true,
}).meta({
  description: "Producer Organization with id and name",
  id: "CompactProducer",
});

// Same shape as API_CompactOrganization, renamed to make the consumer role explicit.
export const API_CompactConsumer = API_CompactOrganization.meta({
  description: "Consumer Organization with id, knodeId, and name",
  id: "CompactConsumer",
});
