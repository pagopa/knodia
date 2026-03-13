import z from "zod";

import { keychainType, type KeychainType } from "./commons";

export const keychainTypeOptions = [
  { id: "consumption", label: "Consumer" },
  { id: "production", label: "Producer" },
  { id: "api", label: "API" },
] as const satisfies readonly { id: KeychainType; label: string }[];

const baseKeychainFormSchema = z.object({
  description: z
    .string()
    .max(250, "Description must be at most 250 characters.")
    .optional(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(60, "Name must be at most 60 characters."),
});

export const editKeychainFormSchema = baseKeychainFormSchema;
export type EditKeychainFormValues = z.infer<typeof editKeychainFormSchema>;

export const createKeychainFormSchema = baseKeychainFormSchema.extend({
  type: keychainType,
});

export const createKeychainFormDefaultValues: CreateKeychainFormValues = {
  description: undefined,
  name: "",
  type: "consumption",
};

export type CreateKeychainFormValues = z.infer<typeof createKeychainFormSchema>;
