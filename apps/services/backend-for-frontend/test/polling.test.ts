import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/config/config.ts", () => ({
  config: {
    defaultPollingMaxRetries: 5,
    defaultPollingRetryDelay: 1000,
  },
}));

import { pollingMaxRetriesExceeded } from "../src/models/errors.ts";
import {
  createPollingByCondition,
  createPollingUntilDeletion,
} from "../src/utils/polling.ts";

describe("createPollingByCondition", () => {
  it("Should perform polling until the condition is met", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const result = await createPollingByCondition(mockFetch, {
      defaultPollingMaxRetries: 3,
      defaultPollingRetryDelay: 10,
    })({
      condition: (result) => result === true,
    });

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("Should retry when the fetch function fails with a 404 axios response error", async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(
        new AxiosError("Not Found", "404", undefined, undefined, {
          status: 404,
          statusText: "Not Found",
        } as AxiosResponse),
      )
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const result = await createPollingByCondition(mockFetch, {
      defaultPollingMaxRetries: 3,
      defaultPollingRetryDelay: 10,
    })({
      condition: (result) => result === true,
    });

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("Should throw an error if the condition is not met within the max retries", async () => {
    const mockFetch = vi.fn().mockResolvedValue(false);

    await expect(
      createPollingByCondition(mockFetch, {
        defaultPollingMaxRetries: 3,
        defaultPollingRetryDelay: 10,
      })({
        condition: (result) => result === true,
      }),
    ).rejects.toThrowError(pollingMaxRetriesExceeded(3, 10));

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("Should throw an error if the fetch function fails with a non-404 axios response error", async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(
        new AxiosError("Generic error", "500", undefined, undefined, {
          status: 500,
          statusText: "Generic error",
        } as AxiosResponse),
      )
      .mockResolvedValueOnce(true);

    await expect(
      createPollingByCondition(mockFetch, {
        defaultPollingMaxRetries: 3,
        defaultPollingRetryDelay: 10,
      })({
        condition: (result) => result === true,
      }),
    ).rejects.toThrowError("Generic error");

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("Should throw an error if the fetch function fails with a non-axios error", async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("Generic error"))
      .mockResolvedValueOnce(true);

    await expect(
      createPollingByCondition(mockFetch, {
        defaultPollingMaxRetries: 3,
        defaultPollingRetryDelay: 10,
      })({
        condition: (result) => result === true,
      }),
    ).rejects.toThrowError("Generic error");

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

describe("createPollingUntilDeletion", () => {
  it("Should perform polling until the fetch function fails with a 404 axios response error", async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(
        new AxiosError("Not Found", "404", undefined, undefined, {
          status: 404,
          statusText: "Not Found",
        } as AxiosResponse),
      );

    await createPollingUntilDeletion(mockFetch, {
      defaultPollingMaxRetries: 3,
      defaultPollingRetryDelay: 10,
    })({});

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("Should throw an error if the fetch function does not fail with a 404 axios response error within the max retries", async () => {
    const mockFetch = vi.fn().mockResolvedValue(true);

    await expect(
      createPollingUntilDeletion(mockFetch, {
        defaultPollingMaxRetries: 3,
        defaultPollingRetryDelay: 10,
      })({}),
    ).rejects.toThrowError(pollingMaxRetriesExceeded(3, 10));

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("Should throw an error if the fetch function fails with a non-404 axios response error", async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(
        new AxiosError("Generic error", "500", undefined, undefined, {
          status: 500,
          statusText: "Generic error",
        } as AxiosResponse),
      )
      .mockRejectedValueOnce(
        new AxiosError("Not Found", "404", undefined, undefined, {
          status: 404,
          statusText: "Not Found",
        } as AxiosResponse),
      );

    await expect(
      createPollingUntilDeletion(mockFetch, {
        defaultPollingMaxRetries: 3,
        defaultPollingRetryDelay: 10,
      })({}),
    ).rejects.toThrowError("Generic error");

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("Should throw an error if the fetch function fails with a non-axios error", async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("Generic error"))
      .mockRejectedValueOnce(
        new AxiosError("Not Found", "404", undefined, undefined, {
          status: 404,
          statusText: "Not Found",
        } as AxiosResponse),
      );

    await expect(
      createPollingUntilDeletion(mockFetch, {
        defaultPollingMaxRetries: 3,
        defaultPollingRetryDelay: 10,
      })({}),
    ).rejects.toThrowError("Generic error");

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
