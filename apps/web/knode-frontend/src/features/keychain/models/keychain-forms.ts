import z from "zod";

import { keychainType, type KeychainType } from "./commons";

export const keychainTypeOptions = [
  { id: "consumption", label: "Consumption" },
  { id: "production", label: "Production" },
  { id: "api", label: "Knode API" },
] as const satisfies readonly { id: KeychainType; label: string }[];

const baseKeychainFormSchema = z.object({
  description: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .min(10, "Description must be at least 10 characters.")
        .max(250, "Description must be at most 250 characters."),
    ])
    .optional(),
  name: z
    .string()
    .trim()
    .min(5, "Name must be at least 5 characters.")
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

export const publicKeyUploadFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(5, "Name must be at least 5 characters.")
    .max(60, "Name must be at most 60 characters."),
  pem: z.string().min(1, "Public Key is required."),
});

export type PublicKeyUploadFormValues = z.infer<
  typeof publicKeyUploadFormSchema
>;

export const publicKeyUploadFormDefaultValues: PublicKeyUploadFormValues = {
  name: "",
  pem: "",
};
