import type { KMSClient } from "@aws-sdk/client-kms";

import { afterEach, beforeEach, vi } from "vitest";

const FAKE_SIGNATURE = new Uint8Array([1, 2, 3, 4]);

export const kmsSendMock = vi.fn();
export const testKmsClient = { send: kmsSendMock } as unknown as KMSClient;

beforeEach(() => {
  kmsSendMock.mockReset();
  kmsSendMock.mockResolvedValue({ Signature: FAKE_SIGNATURE });
  vi.useFakeTimers();
  vi.setSystemTime(new Date());
});

afterEach(() => {
  vi.useRealTimers();
});
