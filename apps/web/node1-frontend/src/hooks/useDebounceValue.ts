import { useCallback, useEffect, useRef, useState } from "react";

export interface UseDebouncedValueOptions {
  leading?: boolean;
}

export type UseDebouncedValueReturnValue<T> = [T, () => void];

export function useDebouncedValue<T = unknown>(
  value: T,
  wait: number,
  options: UseDebouncedValueOptions = { leading: false },
): UseDebouncedValueReturnValue<T> {
  const [_value, setValue] = useState(value);
  const mountedRef = useRef(false);
  const timeoutRef = useRef<null | number>(null);
  const cooldownRef = useRef(false);

  const cancel = useCallback(
    () =>
      timeoutRef.current !== null && window.clearTimeout(timeoutRef.current),
    [],
  );

  useEffect(() => {
    if (mountedRef.current) {
      if (!cooldownRef.current && options.leading) {
        cooldownRef.current = true;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValue(value);
      } else {
        cancel();
        timeoutRef.current = window.setTimeout(() => {
          cooldownRef.current = false;
          setValue(value);
        }, wait);
      }
    }
  }, [value, options.leading, wait, cancel]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      cancel();
    };
  }, [cancel]);

  return [_value, cancel];
}
