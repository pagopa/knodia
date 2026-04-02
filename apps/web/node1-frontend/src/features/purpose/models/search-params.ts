import { KnodeId } from "@knodia/common-models/ids";
import { z } from "zod";

export const purposeDetailSearchSchema = z.object({
  knodeId: KnodeId,
});

export const consumerPurposeSearchDefaultValues = {
  offset: 0,
} as const;

export const consumerPurposeSearchSchema = z.object({
  offset: z
    .number()
    .min(0)
    .default(consumerPurposeSearchDefaultValues.offset)
    .catch(consumerPurposeSearchDefaultValues.offset),
});

export const producerPurposeSearchDefaultValues = {
  offset: 0,
} as const;

export const producerPurposeSearchSchema = z.object({
  offset: z
    .number()
    .min(0)
    .default(producerPurposeSearchDefaultValues.offset)
    .catch(producerPurposeSearchDefaultValues.offset),
});
