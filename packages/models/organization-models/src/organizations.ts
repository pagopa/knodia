import { AttributeId } from "@knodia/attribute-models";
import { OrganizationId } from "@knodia/common-models/ids";
import z from "zod";

export const Organization = z.strictObject({
  attributes: z.array(AttributeId).min(1),
  createdAt: z.coerce.date(),
  id: OrganizationId,
  name: z.string(),
  updatedAt: z.coerce.date(),
});
export type Organization = z.infer<typeof Organization>;
