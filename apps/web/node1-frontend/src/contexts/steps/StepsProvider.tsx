import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";

import { type StepConfig, StepsContext } from "./useStepsContext";

export function StepsProvider({
  children,
  stepConfig,
}: {
  children: ReactNode;
  stepConfig: StepConfig[];
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const navigate = useNavigate();

  const goToStep = (stepIndex: number) => {
    const step = stepConfig[stepIndex];
    if (step) {
      setCurrentStepIndex(stepIndex);
      navigate({ to: step.href });
    }
  };

  const nextStep = () => {
    goToStep(currentStepIndex + 1);
  };

  const prevStep = () => {
    goToStep(currentStepIndex - 1);
  };

  const reset = () => {
    setCurrentStepIndex(0);
    goToStep(0);
  };

  return (
    <StepsContext.Provider
      value={{
        currentStepIndex,
        goToStep,
        nextStep,
        prevStep,
        reset,
        steps: stepConfig,
      }}
    >
      {children}
    </StepsContext.Provider>
  );
}
