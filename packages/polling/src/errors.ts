import { genericInternalError } from "../../models/common-models/src/errors.ts";

export function pollingMaxRetriesExceeded(
  retries: number,
  retryDelayMs: number,
) {
  return genericInternalError(
    `Polling exceeded maximum retries (${retries}) with delay ${retryDelayMs}ms`,
  );
}
