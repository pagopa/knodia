import { useLayoutEffect, useRef, useState } from "react";
import { composeRenderProps } from "react-aria-components";
import { twMerge } from "tailwind-merge";

export function composeTailwindRenderProps<T>(
  className: ((v: T) => string) | string | undefined,
  tw: string,
): ((v: T) => string) | string {
  return composeRenderProps(className, (className) => twMerge(tw, className));
}

// React Aria's --trigger-width doesn't reflect the Group width when Group is
// the trigger. Measure the Group and feed the result to the Popover's inline
// width. Shared by the single- and multi-select ComboBoxes so they can't drift.
export function useTriggerWidth() {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | undefined>();

  useLayoutEffect(() => {
    if (!triggerRef.current) return;

    const updateWidth = () => {
      if (triggerRef.current) {
        setWidth(triggerRef.current.offsetWidth);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(triggerRef.current);

    return () => observer.disconnect();
  }, []);

  return { triggerRef, width };
}
