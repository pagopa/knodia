import { API_LocalizedName } from "@knodia/eservice-models/api";
import z from "zod";

export const API_CompactOrganization = z
  .strictObject({
    id: z.uuid(),
    name: API_LocalizedName,
  })
  .meta({
    description: "Organization with only id and name",
    id: "CompactOrganization",
  });
