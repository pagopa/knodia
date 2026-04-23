import { type ReactNode, useMemo, useState } from "react";

import { type StepConfig, StepsContext } from "./useStepsContext";

interface StepsProviderProps {
  children: ReactNode;
  initialStep?: number;
  stepConfig: StepConfig[];
}

export function StepsProvider({
  children,
  initialStep = 0,
  stepConfig,
}: StepsProviderProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const totalSteps = stepConfig.length;
  const stepLabels = useMemo(
    () => stepConfig.map((s) => s.label),
    [stepConfig],
  );

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setCurrentStepIndex(stepIndex);
    }
  };

  const nextStep = () => goToStep(currentStepIndex + 1);
  const prevStep = () => goToStep(currentStepIndex - 1);

  return (
    <StepsContext.Provider
      value={{
        currentStepIndex,
        goToStep,
        nextStep,
        prevStep,
        stepLabels,
        steps: stepConfig,
        totalSteps,
      }}
    >
      {children}
    </StepsContext.Provider>
  );
}
