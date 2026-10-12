// Drizzle's DrizzleQueryError embeds every bound value in its message, stack and
// `params`, so a failing query on e.g. an email column would put PII in the logs.
// Matched by shape rather than `instanceof` to keep drizzle out of this package.
type QueryError = Error & { params: unknown[]; query: string };

const QUERY_ERROR_MESSAGE_PREFIX = "Failed query: ";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Matches both drizzle timestamp modes: ISO strings ("date") and "YYYY-MM-DD hh:mm:ss" ("string").
const TIMESTAMP_REGEX =
  /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}(?::?\d{2})?)?)?$/;

const redactedErrors = new WeakSet<Error>();

/**
 * Redacts in place the non-identifier values bound to failed SQL queries
 * found in `error` or its causes, keeping UUIDs, numbers, booleans, dates
 * and timestamps for debuggability. Returns the same `error`.
 */
export function redactQueryParams<T>(error: T): T {
  redactErrorTree(error, new Set());
  return error;
}

function isQueryError(error: Error): error is QueryError {
  return (
    "query" in error &&
    typeof error.query === "string" &&
    "params" in error &&
    Array.isArray(error.params) &&
    error.message.startsWith(QUERY_ERROR_MESSAGE_PREFIX)
  );
}

function redactErrorTree(error: unknown, visited: Set<Error>): void {
  if (!(error instanceof Error) || visited.has(error)) {
    return;
  }
  visited.add(error);

  if (isQueryError(error) && !redactedErrors.has(error)) {
    redactQueryError(error);
  }
  // Wrapped query errors still leak: loggers print the whole cause chain.
  redactErrorTree(error.cause, visited);
  if (error instanceof AggregateError) {
    error.errors.forEach((inner) => redactErrorTree(inner, visited));
  }
}

function redactQueryError(error: QueryError): void {
  const params = error.params.map(redactQueryParam);
  const message = `${QUERY_ERROR_MESSAGE_PREFIX}${error.query}\nparams: ${String(params)}`;
  // The stack header repeats the original message, so rebuild it from the frames.
  const frames = (error.stack ?? "")
    .split("\n")
    .filter((line) => line.trimStart().startsWith("at "));

  error.params = params;
  error.message = message;
  error.stack = [`${error.name}: ${message}`, ...frames].join("\n");
  redactedErrors.add(error);
}

function redactQueryParam(param: unknown): unknown {
  if (
    param === null ||
    param === undefined ||
    typeof param === "number" ||
    typeof param === "boolean" ||
    typeof param === "bigint" ||
    param instanceof Date
  ) {
    return param;
  }
  if (Array.isArray(param)) {
    return param.map(redactQueryParam);
  }
  if (typeof param === "string") {
    return UUID_REGEX.test(param) || TIMESTAMP_REGEX.test(param)
      ? param
      : `<redacted string(${param.length})>`;
  }
  return "<redacted>";
}
