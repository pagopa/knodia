import type { ReactNode } from "react";

import { useLocation, useNavigate } from "@tanstack/react-router";

import { type StepConfig, StepsContext } from "./useStepsContext";

export function StepsProvider({
  children,
  stepConfig,
}: {
  children: ReactNode;
  stepConfig: StepConfig[];
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const currentStepIndex = stepConfig.findIndex(
    (step) => step.href === location.pathname,
  );

  const goToStep = (stepIndex: number) => {
    const step = stepConfig[stepIndex];
    if (step) {
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
    goToStep(0);
  };

  return (
    <StepsContext.Provider
      value={{
        currentStepIndex: Math.max(0, currentStepIndex),
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
