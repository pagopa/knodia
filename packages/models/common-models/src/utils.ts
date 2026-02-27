import { genericInternalError } from "./errors.ts";

/**
 * Used in protobuf converters to assert that a value is defined.
 */
export function assertRequired<T>(
  value: T | undefined,
  message: string,
): asserts value is T {
  if (value === undefined) {
    throw genericInternalError(message);
  }
}
