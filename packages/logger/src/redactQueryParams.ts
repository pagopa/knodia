// Drizzle's DrizzleQueryError embeds every bound value in its message, stack and
// `params`, so a failing query on e.g. an email column would put PII in the logs.
// Matched by shape rather than `instanceof` to keep drizzle out of this package.
type QueryError = Error & { params: unknown[]; query: string };

const QUERY_ERROR_MESSAGE_PREFIX = "Failed query: ";
// Constant, so redacting an already redacted error is a no-op.
const REDACTED = "<redacted>";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mutates `error` (and its causes) in place and returns it. */
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

  if (isQueryError(error)) {
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
  // The stack header repeats the original message. Strip it exactly rather than
  // keeping "at " lines, which a multiline param could fake.
  const originalHeader = `${error.name}: ${error.message}`;
  const frames = error.stack?.startsWith(originalHeader)
    ? error.stack.slice(originalHeader.length)
    : "";

  error.params = params;
  error.message = message;
  error.stack = `${error.name}: ${message}${frames}`;
}

function redactQueryParam(param: unknown): unknown {
  if (Array.isArray(param)) {
    return param.map(redactQueryParam);
  }
  const isKept =
    param === null ||
    param === undefined ||
    typeof param === "number" ||
    typeof param === "boolean" ||
    typeof param === "bigint" ||
    // Dates and timestamps are redacted too: they include birth dates.
    (typeof param === "string" && UUID_REGEX.test(param));
  return isKept ? param : REDACTED;
}
