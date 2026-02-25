import { z } from "zod";

const RequiredAttribute = z.strictObject({
  code: z.string(),
  scheme: z.string(),
});
export type RequiredAttribute = z.infer<typeof RequiredAttribute>;

export const RequiredAttributeGroup = z.array(RequiredAttribute).min(1);
export type RequiredAttributeGroup = z.infer<typeof RequiredAttributeGroup>;
