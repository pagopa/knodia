import { maxNameLength, minNameLength } from "@knodia/eservice-models";
import z from "zod";

export const API_CompactOrganization = z
  .strictObject({
    id: z.uuid(),
    name: z.string().min(minNameLength).max(maxNameLength),
  })
  .meta({
    description: "Organization with only id and name",
    id: "CompactOrganization",
  });
