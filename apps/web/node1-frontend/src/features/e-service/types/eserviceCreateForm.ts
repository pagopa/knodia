import type { EserviceMode } from "@knodia/eservice-models";

import type { StepConfig } from "@/contexts/steps/useStepsContext";

export interface EServiceFormData {
  description: string;
  mode: EserviceMode;
  name: string;
}

export function isEserviceMode(value: string): value is EserviceMode {
  return value === "ProvideData" || value === "ReceiveData";
}

export const ESERVICE_FORM_DEFAULTS: EServiceFormData = {
  description: "",
  mode: "ProvideData",
  name: "",
};

export const CREATE_FORM_STEPS: StepConfig[] = [
  { href: "/production/e-services/new/general", label: "General" },
  { href: "/production/e-services/new/technical", label: "Technical" },
  { href: "/production/e-services/new/docs", label: "Docs" },
  { href: "/production/e-services/new/attributes", label: "Attributes" },
  { href: "/production/e-services/new/recap", label: "Recap" },
];
