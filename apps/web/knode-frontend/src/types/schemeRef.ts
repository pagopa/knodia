import { z } from "zod";

export const schemeRefSchema = z.object({
  code: z.string(),
  scheme: z.string(),
});

export type SchemeRef = z.infer<typeof schemeRefSchema>;
