import type { StepConfig } from "@/contexts/steps";

interface EServiceFormData {
  accessTokenAudience: string;
  accessTokenDuration: string;
  accessTokenType: "Bearer" | "DPoP";
  // TODO: will this need to be a string?
  categories?: string;
  description: string;
  interfaceDocument: File | null;
  isSignalHubEnabled: boolean;
  // TODO: this should be a number
  maxDailyCallsPerConsumer: string;
  // TODO: this should be a number
  maxDailyCallsPerKnode: string;
  mode: "ProvideData" | "ReceiveData";
  name: string;
  // TODO: will this need to be a string?
  requiredAttributes: string;
}

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
