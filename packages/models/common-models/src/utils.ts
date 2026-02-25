/**
 * Used in profobuf converters to assert that a value is defined.
 */
export function assertRequired<T>(
  value: T | undefined,
  message: string,
): asserts value is T {
  if (value === undefined) {
    throw new Error(message);
  }
}
