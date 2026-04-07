import { KnodeId } from "@knodia/common-models/ids";
import { z } from "zod";

export const purposeDetailSearchSchema = z.object({
  knodeId: KnodeId,
});

export const purposeListSearchDefaultValues = {
  offset: 0,
} as const;

export const purposeListSearchSchema = z.object({
  offset: z
    .number()
    .min(0)
    .default(purposeListSearchDefaultValues.offset)
    .catch(purposeListSearchDefaultValues.offset),
});
