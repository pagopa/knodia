import { z } from "zod";

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
