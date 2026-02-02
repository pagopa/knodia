import type { StepConfig } from "@/contexts/steps";

interface EServiceFormData {
  accessTokenDuration: string;
  // TODO: will this need to be a string?
  categories?: string;
  description: string;
  name: string;
}

export const ESERVICE_FORM_DEFAULTS: EServiceFormData = {
  accessTokenDuration: "3600",
  categories: "",
  description: "",
  name: "",
};

export const CREATE_FORM_STEPS: StepConfig[] = [
  { label: "General" },
  { label: "Technical" },
  { label: "Docs" },
  { label: "Attributes" },
  { label: "Recap" },
];
