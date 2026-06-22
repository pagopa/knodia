import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  refreshableInternalTokenGenerator,
  type RefreshableInternalTokenGenerator,
} from "../src/refreshableInternalTokenGenerator.ts";
import {
  type InternalTokenInput,
  tokenGeneratorBuilder,
} from "../src/tokenGenerator.ts";
import { kmsSendMock, testKmsClient } from "./utils.ts";

const REFRESH_BEFORE_EXP_SECONDS = 30;
const SECONDS_DURATION = 300;

const generator = tokenGeneratorBuilder(testKmsClient);

const input: InternalTokenInput = {
  audience: "test-audience",
  issuer: "test-issuer",
  kid: "test-kid",
  secondsDuration: SECONDS_DURATION,
  subject: "test-service",
};

describe("refreshableInternalTokenGenerator", () => {
  let refreshable: RefreshableInternalTokenGenerator;
  beforeEach(() => {
    refreshable = refreshableInternalTokenGenerator(input, generator);
  });
  it("generates a token on the first call", async () => {
    const result = await refreshable.get();

    expect(result.type).toBe("internal");
    expect(result.payload.sub).toBe("test-service");
    expect(kmsSendMock).toHaveBeenCalledOnce();
  });

  it("returns cached token on subsequent calls", async () => {
    const first = await refreshable.get();
    const second = await refreshable.get();

    expect(second).toBe(first);
    expect(kmsSendMock).toHaveBeenCalledOnce();
  });

  it("refreshes the token when near expiry", async () => {
    const first = await refreshable.get();

    // Advance time to within the refresh window
    const msUntilRefreshWindow =
      (SECONDS_DURATION - REFRESH_BEFORE_EXP_SECONDS) * 1000 + 1;
    vi.advanceTimersByTime(msUntilRefreshWindow);

    const second = await refreshable.get();

    expect(second).not.toBe(first);
    expect(second.payload.iat).toBeGreaterThan(first.payload.iat);
    expect(kmsSendMock).toHaveBeenCalledTimes(2);
  });
});
