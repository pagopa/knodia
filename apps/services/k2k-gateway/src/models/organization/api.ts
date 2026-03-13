import { API_OrganizationId } from "@knodia/common-models/api";
import z from "zod";

import { API_Attribute } from "../attribute/api.ts";

export const API_Organization = z
  .strictObject({
    attributes: z.array(API_Attribute).meta({
      description: "Attributes associated with the Organization",
    }),
    id: API_OrganizationId,
    name: z.string().meta({
      description: "Human-readable name of the Organization",
    }),
  })
  .meta({ id: "Organization" });

export type API_Organization = z.infer<typeof API_Organization>;

export const API_OrganizationIdPathParam = z.strictObject({
  organizationId: API_OrganizationId,
});
