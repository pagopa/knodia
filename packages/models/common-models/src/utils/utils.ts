import { genericInternalError } from "../errors.ts";

/**
 * Used in Protobuf converters to assert that a value is defined.
 */
export function assertRequired<T>(
  value: T | undefined,
  propertyName: string,
): asserts value is T {
  if (value === undefined) {
    throw genericInternalError(`${propertyName} is undefined`);
  }
}
