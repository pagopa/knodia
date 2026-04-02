import { API_Attribute } from "@knodia/attribute-models/api";
import { API_KnodeId } from "@knodia/common-models/internalApi";
import { z } from "zod";

export const API_SessionOrganization = z
  .strictObject({
    attributes: z.array(API_Attribute),
    id: z.uuid(),
    knodeId: API_KnodeId,
    name: z.string().min(1),
  })
  .meta({
    description:
      "Organization details for the current session, including attributes",
    id: "SessionOrganization",
  });
export type API_SessionOrganization = z.infer<typeof API_SessionOrganization>;
