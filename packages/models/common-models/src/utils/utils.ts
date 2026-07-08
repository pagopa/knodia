import { genericInternalError } from "../errors.ts";
import { PG_UNIQUE_VIOLATION } from "../pgErrorCodes.ts";

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

export function dateToSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function exactlyOneDefined(...values: unknown[]): boolean {
  return values.filter((v) => v !== undefined).length === 1;
}

/**
 * Checks if the given error is a PostgreSQL unique violation error.
 * This is useful to determine if a database operation failed due to a unique constraint violation
 */
export function isPgUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    "cause" in error &&
    error.cause instanceof Error &&
    "code" in error.cause &&
    error.cause.code === PG_UNIQUE_VIOLATION
  );
}

/**
 * Rethrows the failures of settled promises: the single reason when one
 * failed, an AggregateError when several did. No-op when all fulfilled.
 */
export function rethrowSettledFailures(
  results: readonly PromiseSettledResult<unknown>[],
): void {
  const failures = results.filter((r) => r.status === "rejected");

  if (failures.length === 0) return;

  if (failures.length === 1) {
    throw failures[0]?.reason;
  }

  throw new AggregateError(failures.map((failure) => failure.reason));
}
