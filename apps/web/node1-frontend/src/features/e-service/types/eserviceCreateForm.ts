import type { StepConfig } from "@/contexts/steps/useStepsContext";

export interface EServiceFormData {
  accessTokenDuration: string;
  description: string;
  name: string;
}

export const ESERVICE_FORM_DEFAULTS: EServiceFormData = {
  accessTokenDuration: "3600",
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
