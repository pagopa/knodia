import { API_KnodeId } from "@knodia/common-models/internalApi";
import {
  maxOrganizationNameLength,
  minOrganizationNameLength,
} from "@knodia/organization-models/api";
import z from "zod";

export const API_CompactOrganization = z
  .strictObject({
    id: z.uuid(),
    knodeId: API_KnodeId,
    name: z
      .string()
      .min(minOrganizationNameLength)
      .max(maxOrganizationNameLength),
  })
  .meta({
    description: "Organization with only id, knodeId, and name",
    id: "CompactOrganization",
  });
