import {
  METADATA_VERSION_HEADER,
  missingHeader,
} from "@knodia/fastify-zod-api-commons/models";
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
  getMetadataVersionFromHeaders,
  isPolledVersionAtLeastResponseVersion,
  isPolledVersionAtLeastTargetVersion,
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

const makeResponse = (
  version?: AxiosResponse["headers"][typeof METADATA_VERSION_HEADER],
): AxiosResponse =>
  ({
    data: {},
    headers:
      version === undefined ? {} : { [METADATA_VERSION_HEADER]: version },
    status: 200,
    statusText: "OK",
  }) as AxiosResponse;

describe("getMetadataVersionFromHeaders", () => {
  it("Should parse a valid metadata version header", () => {
    expect(getMetadataVersionFromHeaders(makeResponse("3").headers)).toBe(3);
  });

  it.each([undefined, "-1", "1.5", "abc"])(
    "Should throw for invalid metadata version header %p",
    (version) => {
      expect(() =>
        getMetadataVersionFromHeaders(makeResponse(version).headers),
      ).toThrowError(missingHeader(METADATA_VERSION_HEADER));
    },
  );
});

describe("isPolledVersionAtLeastResponseVersion", () => {
  it("Should return true when the polled version matches the response version", () => {
    const condition = isPolledVersionAtLeastResponseVersion(makeResponse("2"));

    expect(condition(makeResponse("2"))).toBe(true);
  });

  it("Should return true when the polled version is greater than the response version", () => {
    const condition = isPolledVersionAtLeastResponseVersion(makeResponse("2"));

    expect(condition(makeResponse("3"))).toBe(true);
  });

  it("Should return false when the polled version is lower than the response version", () => {
    const condition = isPolledVersionAtLeastResponseVersion(makeResponse("2"));

    expect(condition(makeResponse("1"))).toBe(false);
  });

  it("Should throw when the initial response is missing the metadata version header", () => {
    expect(() =>
      isPolledVersionAtLeastResponseVersion(makeResponse()),
    ).toThrowError(missingHeader(METADATA_VERSION_HEADER));
  });
});

describe("isPolledVersionAtLeastTargetVersion", () => {
  it("Should return true when the polled version matches the target version", () => {
    expect(isPolledVersionAtLeastTargetVersion(4)(makeResponse("4"))).toBe(
      true,
    );
  });

  it("Should return true when the polled version exceeds the target version", () => {
    expect(isPolledVersionAtLeastTargetVersion(4)(makeResponse("5"))).toBe(
      true,
    );
  });

  it("Should return false when the polled version is below the target version", () => {
    expect(isPolledVersionAtLeastTargetVersion(4)(makeResponse("3"))).toBe(
      false,
    );
  });

  it("Should throw when the polled response is missing the metadata version header", () => {
    expect(() =>
      isPolledVersionAtLeastTargetVersion(4)(makeResponse()),
    ).toThrowError(missingHeader(METADATA_VERSION_HEADER));
  });
});
