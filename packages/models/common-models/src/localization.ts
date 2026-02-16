import z from "zod";

export const LocalizedText = (min: number, max: number) =>
  z.strictObject({
    en: z.string().min(min).max(max),
  });
export type LocalizedText = z.infer<typeof LocalizedText>;
