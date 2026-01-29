import { createContext, useContext } from "react";

export interface StepConfig {
  href: string;
  label: string;
}

export interface StepsContextValue {
  currentStepIndex: number;
  goToStep: (stepIndex: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  steps: StepConfig[];
}

export const StepsContext = createContext<null | StepsContextValue>(null);

export function useStepsContext() {
  const context = useContext(StepsContext);
  if (!context) {
    throw new Error("useSteps must be used within a StepsProvider");
  }
  return context;
}
