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
  const cleanupRef = useRef<(() => void) | null>(null);

  const ref = useCallback((node: null | T) => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (!node) return;

    const measure = () =>
      setIsOverflowing(node.scrollHeight > node.clientHeight);

    // Observe the container (its clientHeight tracks viewport changes) and its
    // children (their size tracks content that grows/reflows without resizing
    // the height-capped container, e.g. async-loaded rows).
    const resizeObserver = new ResizeObserver(measure);
    const observeContent = () => {
      resizeObserver.disconnect();
      resizeObserver.observe(node);
      for (const child of node.children) resizeObserver.observe(child);
      measure();
    };
    observeContent();

    // Re-sync observed children when the child list changes.
    const mutationObserver = new MutationObserver(observeContent);
    mutationObserver.observe(node, { childList: true });

    cleanupRef.current = () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return { ref, isOverflowing };
}
