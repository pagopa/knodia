import { useCallback, useLayoutEffect, useRef, useState } from "react";
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

// A scroll container with only static children is unreachable by keyboard
// (browsers scroll with arrow/Page keys only when the container is focused);
// detect overflow so it can be made focusable only when it actually scrolls.
// A callback ref (not useEffect) is required: react-aria portals the content
// in a later commit, so an effect would run before the node exists.
export function useVerticalOverflow<T extends HTMLElement = HTMLElement>() {
  const [isOverflowing, setIsOverflowing] = useState(false);
  const observerRef = useRef<null | ResizeObserver>(null);

  const ref = useCallback((node: null | T) => {
    observerRef.current?.disconnect();
    if (!node) return;

    const measure = () =>
      setIsOverflowing(node.scrollHeight > node.clientHeight);

    measure();
    observerRef.current = new ResizeObserver(measure);
    observerRef.current.observe(node);
  }, []);

  return { ref, isOverflowing };
}
