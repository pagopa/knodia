import { z } from "zod";

export const operatorsSearchValues = {
  offset: 0,
} as const;

export const operatorsSearchSchema = z.object({
  offset: z
    .number()
    .min(0)
    .default(operatorsSearchValues.offset)
    .catch(operatorsSearchValues.offset),
});
