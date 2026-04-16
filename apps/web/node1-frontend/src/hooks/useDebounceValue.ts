import { useCallback, useEffect, useRef, useState } from "react";

type UseDebounceValueReturnValue<T> = [T, () => void];

export function useDebounceValue<T = unknown>(
  value: T,
  wait: number,
): UseDebounceValueReturnValue<T> {
  const [_value, setValue] = useState(value);
  const mountedRef = useRef(false);
  const timeoutRef = useRef<null | number>(null);

  const cancel = useCallback(
    () =>
      timeoutRef.current !== null && window.clearTimeout(timeoutRef.current),
    [],
  );

  useEffect(() => {
    if (mountedRef.current) {
      cancel();
      timeoutRef.current = window.setTimeout(() => {
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
