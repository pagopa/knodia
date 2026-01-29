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
  { href: "/production/e-services/new/general", label: "General" },
  { href: "/production/e-services/new/technical", label: "Technical" },
  { href: "/production/e-services/new/docs", label: "Docs" },
  { href: "/production/e-services/new/attributes", label: "Attributes" },
  { href: "/production/e-services/new/recap", label: "Recap" },
];
