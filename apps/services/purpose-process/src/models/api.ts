import { PurposeId } from "@knodia/common-models/ids";
import z from "zod";

// TODO: add fields once the Purpose model is finalized
export const API_Purpose = z
  .strictObject({
    createdAt: z.iso.datetime(),
    id: PurposeId,
    updatedAt: z.iso.datetime(),
  })
  .meta({ id: "Purpose" });
export type API_Purpose = z.infer<typeof API_Purpose>;
