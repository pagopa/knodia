import { z } from "zod";

import type { StepConfig } from "@/contexts/steps";

const ACCEPTED_MIME_TYPES = [
  "application/json",
  "application/yaml",
  "text/yaml",
  "application/x-yaml",
  "text/x-yaml",
];

const schemeRefSchema = z.object({
  code: z.string(),
  scheme: z.string(),
});

export type SchemeRef = z.infer<typeof schemeRefSchema>;

// Schema for form fields
const eserviceFieldSchemas = {
  accessTokenAudience: z.string().min(1, "Access token audience is required."),
  accessTokenDuration: z
    .number()
    .min(1, "Duration must be at least 1 minute.")
    .max(1440, "Duration must be at most 1440 minutes (24 hours)."),
  accessTokenType: z.enum(["Bearer", "DPoP"]),
  categories: z.array(schemeRefSchema),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters.")
    .max(250, "Description must be at most 250 characters."),
  interfaceDocument: z
    .file("API specs file is required.")
    .max(1024 * 1024, "File size must be at most 1 MB.")
    .mime(ACCEPTED_MIME_TYPES, "File must be YAML or JSON format."),
  isSignalHubEnabled: z.boolean(),
  maxDailyCallsPerConsumer: z.number().min(1, "Must be at least 1."),
  maxDailyCallsPerKnode: z.number().min(1, "Must be at least 1."),
  mode: z.enum(["ProvideData", "ReceiveData"]),
  name: z
    .string()
    .min(5, "Name must be at least 5 characters.")
    .max(60, "Name must be at most 60 characters."),
  requiredAttributes: z
    .array(
      z
        .array(schemeRefSchema)
        .min(1, "Group must have at least one attribute."),
    )
    .min(1, "At least one group is required."),
};

export const eserviceFormSchema = z.object(eserviceFieldSchemas);
export type EServiceFormData = z.infer<typeof eserviceFormSchema>;

// Draft version of the form data: the interface document is nullable
// because it's not required until the user submits the form.
// This allows saving partial progress across steps without a valid file.
export type EServiceFormDraftData = DocsStepDraftData &
  Omit<EServiceFormData, "interfaceDocument">;

// Step-specific validation schemas
export const generalStepSchema = z.object({
  categories: eserviceFieldSchemas.categories,
  description: eserviceFieldSchemas.description,
  name: eserviceFieldSchemas.name,
});

export const technicalStepSchema = z.object({
  accessTokenAudience: eserviceFieldSchemas.accessTokenAudience,
  accessTokenDuration: eserviceFieldSchemas.accessTokenDuration,
  accessTokenType: eserviceFieldSchemas.accessTokenType,
  isSignalHubEnabled: eserviceFieldSchemas.isSignalHubEnabled,
  maxDailyCallsPerConsumer: eserviceFieldSchemas.maxDailyCallsPerConsumer,
  maxDailyCallsPerKnode: eserviceFieldSchemas.maxDailyCallsPerKnode,
  mode: eserviceFieldSchemas.mode,
});

export const docsStepSchema = z.object({
  interfaceDocument: eserviceFieldSchemas.interfaceDocument,
});

export const attributesStepSchema = z.object({
  requiredAttributes: eserviceFieldSchemas.requiredAttributes,
});

// Step types
export type AttributesStepData = z.infer<typeof attributesStepSchema>;
export type DocsStepData = z.infer<typeof docsStepSchema>;
export type GeneralStepData = z.infer<typeof generalStepSchema>;
export type TechnicalStepData = z.infer<typeof technicalStepSchema>;
// Override interfaceDocument to be nullable: in DocsStepData it's required (File),
// but in draft mode we need null to represent the initial empty state.
type DocsStepDraftData = Omit<DocsStepData, "interfaceDocument"> & {
  interfaceDocument: File | null;
};

// Step defaults
export const GENERAL_STEP_DEFAULTS: z.input<typeof generalStepSchema> = {
  categories: [],
  description: "",
  name: "",
};

export const TECHNICAL_STEP_DEFAULTS: z.input<typeof technicalStepSchema> = {
  accessTokenAudience: "",
  accessTokenDuration: NaN,
  accessTokenType: "Bearer",
  isSignalHubEnabled: false,
  maxDailyCallsPerConsumer: NaN,
  maxDailyCallsPerKnode: NaN,
  mode: "ProvideData",
};

export const DOCS_STEP_DEFAULTS: DocsStepDraftData = {
  interfaceDocument: null,
};

export const ATTRIBUTES_STEP_DEFAULTS: z.input<typeof attributesStepSchema> = {
  requiredAttributes: [[]],
};

// Full form defaults (for accumulated data)
export const ESERVICE_FORM_DEFAULTS: EServiceFormDraftData = {
  ...GENERAL_STEP_DEFAULTS,
  ...TECHNICAL_STEP_DEFAULTS,
  ...DOCS_STEP_DEFAULTS,
  ...ATTRIBUTES_STEP_DEFAULTS,
};

export const CREATE_FORM_STEPS: StepConfig[] = [
  { label: "General" },
  { label: "Technical" },
  { label: "Docs" },
  { label: "Attributes" },
  { label: "Recap" },
];
