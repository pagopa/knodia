import { useCallback, useEffect, useRef, useState } from "react";

type UseDebouncedValueReturnValue<T> = [T, () => void];

export function useDebouncedValue<T = unknown>(
  value: T,
  wait: number,
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
      cancel();
      timeoutRef.current = window.setTimeout(() => {
        cooldownRef.current = false;
        setValue(value);
      }, wait);
    }
  }, [value, wait, cancel]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      cancel();
    };
  }, [cancel]);

  return [_value, cancel];
}
