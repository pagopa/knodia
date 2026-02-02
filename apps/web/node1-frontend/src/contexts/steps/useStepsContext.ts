import { createContext, useContext } from "react";

export interface StepConfig {
  label: string;
}

interface StepsContextValue {
  currentStepIndex: number;
  goToStep: (stepIndex: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  steps: StepConfig[];
  totalSteps: number;
}

export const StepsContext = createContext<null | StepsContextValue>(null);

export function useStepsContext() {
  const context = useContext(StepsContext);
  if (!context) {
    throw new Error("useStepsContext must be used within a StepsProvider");
  }
  return context;
}
