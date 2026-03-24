import { createContext, type ReactNode, useContext } from "react";

export interface StepConfig {
  content: ReactNode;
  label: string;
}

interface StepsContextValue {
  currentStepIndex: number;
  goToStep: (stepIndex: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  stepLabels: string[];
  steps: StepConfig[];
  totalSteps: number;
}

export const StepsContext = createContext<null | StepsContextValue>(null);

export function useCurrentStep(): StepConfig {
  const { currentStepIndex, steps } = useStepsContext();
  const step = steps[currentStepIndex];
  if (!step) {
    throw new Error(`Invalid step index: ${currentStepIndex}`);
  }
  return step;
}

export function useStepsContext() {
  const context = useContext(StepsContext);
  if (!context) {
    throw new Error("useStepsContext must be used within a StepsProvider");
  }
  return context;
}
