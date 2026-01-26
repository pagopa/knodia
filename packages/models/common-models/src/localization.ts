import z from "zod";

export const LocalizedText = z.strictObject({
  en: z.string(),
});
export type LocalizedText = z.infer<typeof LocalizedText>;
