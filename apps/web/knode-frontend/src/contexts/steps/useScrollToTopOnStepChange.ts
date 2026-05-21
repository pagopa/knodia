import { type RefObject, useLayoutEffect } from "react";

import { useStepsContext } from "./useStepsContext";

export function useScrollToTopOnStepChange(ref: RefObject<HTMLElement | null>) {
  const { currentStepIndex } = useStepsContext();
  useLayoutEffect(() => {
    ref.current?.scrollIntoView({ block: "start" });
  }, [currentStepIndex, ref]);
}
