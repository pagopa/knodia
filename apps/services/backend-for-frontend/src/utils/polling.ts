import {
  METADATA_VERSION_HEADER,
  missingHeader,
} from "@knodia/fastify-zod-api-commons/models";
import { type AxiosResponse, isAxiosError } from "axios";
import z from "zod";

import { pollingMaxRetriesExceeded } from "../models/errors.ts";

export type PollingService = ReturnType<typeof pollingServiceBuilder>;

export const PollingConfig = z
  .object({
    DEFAULT_POLLING_MAX_RETRIES: z.coerce.number().default(5),
    DEFAULT_POLLING_RETRY_DELAY: z.coerce.number().default(400),
  })
  .transform((c) => ({
    defaultPollingMaxRetries: c.DEFAULT_POLLING_MAX_RETRIES,
    defaultPollingRetryDelay: c.DEFAULT_POLLING_RETRY_DELAY,
  }));
export type PollingConfig = z.infer<typeof PollingConfig>;

export function createPollingByCondition<T>(
  fetch: () => Promise<T>,
  config: PollingConfig,
) {
  return async function poll({
    condition,
    maxRetries = config.defaultPollingMaxRetries,
    retryDelay = config.defaultPollingRetryDelay,
  }: {
    condition: (pollingResult: T) => boolean;
    maxRetries?: number;
    retryDelay?: number;
  }): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      await delay(retryDelay);
      try {
        const pollingResult = await fetch();
        if (condition(pollingResult)) return pollingResult;
      } catch (error: unknown) {
        // If the error is 404, continue polling
        if (is404AxiosError(error)) continue;
        throw error;
      }
    }

    throw pollingMaxRetriesExceeded(maxRetries, retryDelay);
  };
}

export function createPollingUntilDeletion(
  fetch: () => Promise<unknown>,
  config: PollingConfig,
) {
  return async function poll({
    maxRetries = config.defaultPollingMaxRetries,
    retryDelay = config.defaultPollingRetryDelay,
  }: {
    maxRetries?: number;
    retryDelay?: number;
  } = {}): Promise<void> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      await delay(retryDelay);
      try {
        await fetch();
      } catch (error: unknown) {
        // If the error is 404, it means the resource has been deleted, so we can stop polling
        if (is404AxiosError(error)) return;
        throw error;
      }
    }

    throw pollingMaxRetriesExceeded(maxRetries, retryDelay);
  };
}

export function getMetadataVersionFromHeaders(
  headers: AxiosResponse["headers"],
): number {
  const version = z.coerce
    .number()
    .int()
    .nonnegative()
    .safeParse(headers[METADATA_VERSION_HEADER]);

  if (!version.success || isNaN(version.data)) {
    throw missingHeader(METADATA_VERSION_HEADER);
  }

  return version.data;
}

/**
 Default polling check function that checks if the polled resource's version is greater than
 the version of the resource of a given response.
 Example usage:
 - Create or update a resource, obtaining "response" as the result of the operation
 - Poll the created/updated resource using the "pollResource" function
 - Pass the "response" to this function to obtain the "checkFn" to be passed to "pollResource"
 */
export function isPolledVersionAtLeastResponseVersion(
  response: AxiosResponse,
): (polledResponse: AxiosResponse) => boolean {
  return isPolledVersionAtLeastTargetVersion(
    getMetadataVersionFromHeaders(response.headers),
  );
}

/**
 * Generic check function that verifies if a polled resource's version meets or exceeds a target version.
 * Use this when only metadata (with a version number) is available rather than a full resource response.
 * For cases where a complete response object is available, use isPolledVersionAtLeastResponseVersion instead.
 *
 * @param targetVersion - The target version number to compare against
 * @returns A function that takes a polled resource and returns true if its version is >= target version
 */
export function isPolledVersionAtLeastTargetVersion(
  targetVersion: number,
): (polledResponse: AxiosResponse) => boolean {
  return (polledResponse: AxiosResponse) =>
    getMetadataVersionFromHeaders(polledResponse.headers) >= targetVersion;
}

export function pollingServiceBuilder(config: PollingConfig) {
  return {
    pollResourceUntilDeletion(
      fetch: () => Promise<unknown>,
    ): (options?: {
      maxRetries?: number;
      retryDelay?: number;
    }) => Promise<void> {
      return createPollingUntilDeletion(fetch, config);
    },

    /**
     * Generic polling function that polls a fetch call of a resource with metadata
     * until a condition is met or max retries are exceeded.
     *
     * @param fetch - Function that returns a Promise that fetches the resource with metadata
     * @returns A function that takes a condition function and returns a Promise of the polled resource
     */
    pollResourceWithMetadata<T>(
      fetch: () => Promise<T>,
    ): (options: {
      condition: (pollingResult: T) => boolean;
      maxRetries?: number;
      retryDelay?: number;
    }) => Promise<T> {
      return createPollingByCondition(fetch, config);
    },
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function is404AxiosError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}
