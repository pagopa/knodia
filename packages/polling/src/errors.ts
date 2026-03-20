export function pollingMaxRetriesExceeded(
  retries: number,
  retryDelayMs: number,
) {
  return new Error(
    `Polling exceeded maximum retries (${retries}) with delay ${retryDelayMs}ms`,
  );
}
