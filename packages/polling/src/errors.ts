import { genericInternalError } from "@knodia/common-models/errors";

export function pollingMaxRetriesExceeded(
  retries: number,
  retryDelayMs: number,
) {
  return genericInternalError(
    `Polling exceeded maximum retries (${retries}) with delay ${retryDelayMs}ms`,
  );
}
