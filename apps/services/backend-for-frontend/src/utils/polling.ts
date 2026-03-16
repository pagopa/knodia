import {
  genericError,
  METADATA_VERSION_HEADER,
  missingHeader,
} from "@knodia/fastify-zod-api-commons/models";
import { type AxiosResponse, isAxiosError } from "axios";
import z from "zod";

import { config } from "../config/config.ts";
import { pollingMaxRetriesExceeded } from "../models/errors.ts";

export function createPollingByCondition<T>(
  fetch: () => Promise<T>,
  config: {
    defaultPollingMaxRetries: number;
    defaultPollingRetryDelay: number;
  },
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
  config: {
    defaultPollingMaxRetries: number;
    defaultPollingRetryDelay: number;
  },
) {
  return async function poll({
    maxRetries = config.defaultPollingMaxRetries,
    retryDelay = config.defaultPollingRetryDelay,
  }: {
    maxRetries?: number;
    retryDelay?: number;
  }): Promise<void> {
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
  fetch: () => Promise<T>,
): ReturnType<typeof createPollingByCondition<T>> {
  return createPollingByCondition(fetch, {
    defaultPollingMaxRetries: config.defaultPollingMaxRetries,
    defaultPollingRetryDelay: config.defaultPollingRetryDelay,
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getMetadataVersionFromHeaders(
  headers: AxiosResponse["headers"],
): number {
  const rawHeaderValue = headers[METADATA_VERSION_HEADER];

  if (!rawHeaderValue) {
    throw missingHeader(METADATA_VERSION_HEADER);
  }

  const version = z.coerce
    .number()
    .int()
    .nonnegative()
    .safeParse(rawHeaderValue);

  if (!version.success || isNaN(version.data)) {
    throw genericError(
      `Invalid ${METADATA_VERSION_HEADER} header value: ${rawHeaderValue}`,
    );
  }

  return version.data;
}

function is404AxiosError(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

/**
 * Generic check function that verifies if a polled resource's version meets or exceeds a target version.
 * Use this when only metadata (with a version number) is available rather than a full resource response.
 * For cases where a complete response object is available, use isPolledVersionAtLeastResponseVersion instead.
 *
 * @param targetVersion - The target version number to compare against
 * @returns A function that takes a polled resource and returns true if its version is >= target version
 */
function isPolledVersionAtLeastTargetVersion(
  targetVersion: number,
): (polledResponse: AxiosResponse) => boolean {
  return (polledResponse: AxiosResponse) =>
    getMetadataVersionFromHeaders(polledResponse.headers) >= targetVersion;
}
