import { isAxiosError } from "axios";

import { pollingMaxRetriesExceeded } from "../models/errors.ts";

const DEFAULT_POLLING_MAX_RETRIES = 5;
const DEFAULT_POLLING_RETRY_DELAY = 1000;

/**
 * Generic check function that verifies if a polled resource's version meets or exceeds a target version.
 * Use this when only metadata (with a version number) is available rather than a full resource response.
 * For cases where a complete response object is available, use isPolledVersionAtLeastResponseVersion instead.
 *
 * @param metadata - Object containing the target version number to compare against
 * @returns A function that takes a polled resource and returns true if its version is >= target version
 */
export function isPolledVersionAtLeastMetadataTargetVersion(
  metadata: undefined | { version: number },
): <T>(polledResource: WithMaybeMetadata<NonNullable<T>>) => boolean {
  assertTargetMetadataExists(metadata);
  return <T>(polledResource: WithMaybeMetadata<NonNullable<T>>) => {
    assertMetadataExists(polledResource);
    return polledResource.metadata.version >= metadata.version;
  };
}

/**
 Default polling check function that checks if the polled resource's version is greater than
 the version of the resource of a given response.
 Example usage:
 - Create or update a resource, obtaining "response" as the result of the operation
 - Poll the created/updated resource using the "pollResource" function
 - Pass the "response" to this function to obtain the "checkFn" to be passed to "pollResource"
 */
export function isPolledVersionAtLeastResponseVersion<T>(
  response: WithMaybeMetadata<NonNullable<T>>,
): (polledResource: WithMaybeMetadata<NonNullable<T>>) => boolean {
  assertMetadataExists(response);
  return (polledResource: WithMaybeMetadata<NonNullable<T>>) => {
    assertMetadataExists(polledResource);
    return polledResource.metadata.version >= response.metadata.version;
  };
}

export function pollResourceUntilDeletion(
  fetch: () => Promise<unknown>,
): ReturnType<typeof createPollingUntilDeletion> {
  return createPollingUntilDeletion(fetch, {
    defaultPollingMaxRetries: config.defaultPollingMaxRetries,
    defaultPollingRetryDelay: config.defaultPollingRetryDelay,
  });
}

/**
 * Generic polling function that polls a fetch call of a resource with metadata
 * until a condition is met or max retries are exceeded.
 *
 * @param fetch - Function that returns a Promise that fetches the resource with metadata
 * @returns A function that takes a condition function and returns a Promise of the polled resource
 */
export function pollResourceWithMetadata<T>(
  fetch: () => Promise<WithMaybeMetadata<NonNullable<T>>>,
): ReturnType<
  typeof createPollingByCondition<WithMaybeMetadata<NonNullable<T>>>
> {
  return createPollingByCondition(fetch, {
    defaultPollingMaxRetries: config.defaultPollingMaxRetries,
    defaultPollingRetryDelay: config.defaultPollingRetryDelay,
  });
}

/**
 * Generic polling function that polls on a fetch call until a condition is met or max retries are exceeded.
 *
 * @param fetch - Function that returns a Promise that fetches the resource
 * @param config - Optional configuration object to override default polling settings
 * @returns A function that takes a condition function and returns a Promise of the polled resource
 */
function createPollingByCondition<T>(
  fetch: () => Promise<T>,
  config?: {
    defaultPollingMaxRetries: number;
    defaultPollingRetryDelay: number;
  },
) {
  return async function poll({
    condition,
    maxRetries = config?.defaultPollingMaxRetries ||
      DEFAULT_POLLING_MAX_RETRIES,
    retryDelay = config?.defaultPollingRetryDelay ||
      DEFAULT_POLLING_RETRY_DELAY,
  }: {
    condition: (pollingResult: T) => boolean;
    maxRetries?: number;
    retryDelay?: number;
  }): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const pollingResult = await fetch();
        if (condition(pollingResult)) {
          return pollingResult;
        }
      } catch (error: unknown) {
        // If the error isn't 404, rethrow it immediately
        if (!isAxiosError(error) || error.response?.status !== 404) {
          throw error;
        }
      }
      // If we got 404 or condition failed, wait for the specified delay before retrying
      await delay(retryDelay);
    }

    throw pollingMaxRetriesExceeded(maxRetries, retryDelay);
  };
}

/**
 * Polls a resource by repeatedly calling the provided fetch function until the resource is deleted
 * (i.e., a 404 Not Found is returned) or the maximum number of retries is exceeded.
 *
 * @param fetch - A function that returns a Promise resolving when the resource exists,
 *                and rejects with a 404 error when the resource is deleted.
 * @returns  Resolves when the resource is confirmed deleted.
 */
function createPollingUntilDeletion(
  fetch: () => Promise<unknown>,
  config?: {
    defaultPollingMaxRetries: number;
    defaultPollingRetryDelay: number;
  },
) {
  return async function poll({
    maxRetries = config?.defaultPollingMaxRetries ||
      DEFAULT_POLLING_MAX_RETRIES,
    retryDelay = config?.defaultPollingRetryDelay ||
      DEFAULT_POLLING_RETRY_DELAY,
  }: {
    maxRetries?: number;
    retryDelay?: number;
  }): Promise<void> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await fetch();
      } catch (error: unknown) {
        if (isAxiosError(error) && error.response?.status === 404) {
          return;
        }
        throw error;
      }
      await delay(retryDelay);
    }

    throw pollingMaxRetriesExceeded(maxRetries, retryDelay);
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
