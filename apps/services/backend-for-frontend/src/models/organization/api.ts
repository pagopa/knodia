import { API_KnodeId } from "@knodia/common-models/api";
import { API_LocalizedName } from "@knodia/eservice-models/api";
import z from "zod";

export const API_CompactOrganization = z
  .strictObject({
    id: z.uuid(),
    knodeId: API_KnodeId,
    name: API_LocalizedName,
  })
  .meta({
    description: "Organization with only id, knodeId, and name",
    id: "CompactOrganization",
  });
