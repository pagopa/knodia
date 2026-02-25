export function throwIfMissing<T>(value: T | undefined, message: string): T;
export function throwIfMissing<T, R>(
  value: T | undefined,
  message: string,
  converter: (value: T) => R,
): R;
export function throwIfMissing<T, R>(
  value: T | undefined,
  message: string,
  converter?: (value: T) => R,
): R | T {
  if (value === undefined) {
    throw new Error(message);
  }
  return converter ? converter(value) : value;
}
