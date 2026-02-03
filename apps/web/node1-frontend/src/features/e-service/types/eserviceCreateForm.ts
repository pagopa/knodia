import { z } from "zod";

import type { StepConfig } from "@/contexts/steps";

export const eserviceFieldSchemas = {
  accessTokenAudience: z.string().optional(),
  accessTokenDuration: z.string().optional(),
  accessTokenType: z.enum(["Bearer", "DPoP"]),
  // TODO: will this need to be a string?
  categories: z.string().optional(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters.")
    .max(250, "Description must be at most 250 characters."),
  interfaceDocument: z.instanceof(File).nullable(),
  isSignalHubEnabled: z.boolean(),
  // TODO: this should be a number
  maxDailyCallsPerConsumer: z.string().optional(),
  // TODO: this should be a number
  maxDailyCallsPerKnode: z.string().optional(),
  mode: z.enum(["ProvideData", "ReceiveData"]),
  name: z
    .string()
    .min(5, "Name must be at least 5 characters.")
    .max(60, "Name must be at most 60 characters."),
  // TODO: will this need to be a string?
  requiredAttributes: z.string().optional(),
};

export const eserviceFormSchema = z.object(eserviceFieldSchemas);

export type EServiceFormData = z.infer<typeof eserviceFormSchema>;

export const ESERVICE_FORM_DEFAULTS: EServiceFormData = {
  accessTokenAudience: "",
  accessTokenDuration: "",
  accessTokenType: "Bearer",
  categories: "",
  description: "",
  interfaceDocument: null,
  isSignalHubEnabled: false,
  maxDailyCallsPerConsumer: "",
  maxDailyCallsPerKnode: "",
  mode: "ProvideData",
  name: "",
  requiredAttributes: "",
};

export const CREATE_FORM_STEPS: StepConfig[] = [
  { label: "General" },
  { label: "Technical" },
  { label: "Docs" },
  { label: "Attributes" },
  { label: "Recap" },
];
