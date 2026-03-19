import z from "zod";

import { keychainType, type KeychainType } from "./commons";

export const keychainTypeOptions = [
  { id: "consumption", label: "Consumer" },
  { id: "production", label: "Producer" },
  { id: "api", label: "API" },
] as const satisfies readonly { id: KeychainType; label: string }[];

export const createKeychainFormSchema = z.object({
  description: z
    .string()
    .min(10, "Description must be at least 10 characters.")
    .max(250, "Description must be at most 250 characters.")
    .optional(),
  name: z
    .string()
    .min(5, "Name must be at least 5 characters.")
    .max(60, "Name must be at most 60 characters."),
  type: keychainType,
});

export const createKeychainFormDefaultValues: CreateKeychainFormValues = {
  description: undefined,
  name: "",
  type: "consumption",
};

export type CreateKeychainFormValues = z.infer<typeof createKeychainFormSchema>;
