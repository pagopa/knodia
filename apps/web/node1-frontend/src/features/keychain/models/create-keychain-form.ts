import z from "zod";

export const createKeychainFormSchema = z.object({
  description: z
    .string()
    .max(250, "Description must be at most 250 characters."),
  name: z
    .string()
    .min(1, "Name is required")
    .max(60, "Name must be at most 60 characters."),
  type: z.enum(["consumer", "producer", "api"]),
});
