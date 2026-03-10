import { API_KnodeId } from "@knodia/common-models/internalApi";
import { maxNameLength, minNameLength } from "@knodia/eservice-models";
import z from "zod";

export const API_CompactOrganization = z
  .strictObject({
    id: z.uuid(),
    knodeId: API_KnodeId,
    name: z.string().min(minNameLength).max(maxNameLength),
  })
  .meta({
    description: "Organization with only id, knodeId, and name",
    id: "CompactOrganization",
  });
