import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { server } from "@/test/msw/server";

const BFF_URL = import.meta.env["BFF_URL"];

const mockGetAuthToken = vi.fn<() => null | string>();
const mockSetAuthToken = vi.fn();
const mockClearAuthToken = vi.fn();
const mockRedirectToLogout = vi.fn();

vi.mock("@/libs/auth", () => ({
  clearAuthToken: (...args: unknown[]) => mockClearAuthToken(...args),
  getAuthToken: () => mockGetAuthToken(),
  redirectToLogout: () => mockRedirectToLogout(),
  setAuthToken: (...args: unknown[]) => mockSetAuthToken(...args),
}));

// Import after mocks so interceptors bind to mocked auth functions
const { default: axios } = await import("axios");
await import("@/libs/axios");

function setupProtectedEndpoint(responses: { status: number }[]) {
  const callIndex = { current: 0 };

  server.use(
    http.get(`${BFF_URL}/api/data`, () => {
      const status = responses[callIndex.current]?.status ?? 200;
      callIndex.current++;

      if (status === 401) {
        return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      return HttpResponse.json({ result: "ok" }, { status });
    }),
  );
}

function setupRefreshEndpoint(success: boolean) {
  server.use(
    http.post(`${BFF_URL}/auth/ui-session/refresh`, () => {
      if (success) {
        return HttpResponse.json({
          uiSessionToken: "new-session-token",
        });
      }
      return HttpResponse.json({ message: "Invalid" }, { status: 401 });
    }),
  );
}

describe("axios interceptors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthToken.mockReturnValue(null);
  });

  describe("request interceptor (addAuthHeader)", () => {
    it("adds Authorization header when token is present", async () => {
      mockGetAuthToken.mockReturnValue("my-token");

      let capturedAuth: string | undefined;
      server.use(
        http.get(`${BFF_URL}/api/data`, ({ request }) => {
          capturedAuth = request.headers.get("Authorization") ?? undefined;
          return HttpResponse.json({ ok: true });
        }),
      );

      await axios.get(`${BFF_URL}/api/data`);

      expect(capturedAuth).toBe("Bearer my-token");
    });

    it("does not add Authorization header when no token", async () => {
      let capturedAuth: null | string = "initial";
      server.use(
        http.get(`${BFF_URL}/api/data`, ({ request }) => {
          capturedAuth = request.headers.get("Authorization");
          return HttpResponse.json({ ok: true });
        }),
      );

      await axios.get(`${BFF_URL}/api/data`);

      expect(capturedAuth).toBeNull();
    });
  });

  describe("response interceptor (handleUnauthorized)", () => {
    it("retries with new token after successful refresh", async () => {
      mockGetAuthToken
        .mockReturnValueOnce("expired-token")
        .mockReturnValue("new-session-token");

      setupProtectedEndpoint([{ status: 401 }, { status: 200 }]);
      setupRefreshEndpoint(true);

      const response = await axios.get(`${BFF_URL}/api/data`);

      expect(response.data).toEqual({ result: "ok" });
      expect(mockSetAuthToken).toHaveBeenCalledWith("new-session-token");
    });

    it("clears token and redirects to logout when refresh fails", async () => {
      mockGetAuthToken.mockReturnValue("expired-token");

      setupProtectedEndpoint([{ status: 401 }]);
      setupRefreshEndpoint(false);

      await expect(axios.get(`${BFF_URL}/api/data`)).rejects.toThrow();

      expect(mockClearAuthToken).toHaveBeenCalledOnce();
      expect(mockRedirectToLogout).toHaveBeenCalledOnce();
    });

    it("does not intercept non-401 errors", async () => {
      server.use(
        http.get(`${BFF_URL}/api/data`, () =>
          HttpResponse.json({ message: "Server error" }, { status: 500 }),
        ),
      );

      await expect(axios.get(`${BFF_URL}/api/data`)).rejects.toThrow();

      expect(mockClearAuthToken).not.toHaveBeenCalled();
    });

    it("does not intercept 401 on auth endpoints", async () => {
      server.use(
        http.post(`${BFF_URL}/auth/ui-session`, () =>
          HttpResponse.json({ message: "Unauthorized" }, { status: 401 }),
        ),
        http.post(`${BFF_URL}/auth/ui-session/refresh`, () =>
          HttpResponse.json({ message: "Unauthorized" }, { status: 401 }),
        ),
        http.post(`${BFF_URL}/auth/logout`, () =>
          HttpResponse.json({ message: "Unauthorized" }, { status: 401 }),
        ),
      );

      await expect(
        axios.post(`${BFF_URL}/auth/ui-session`, {}),
      ).rejects.toThrow();
      await expect(
        axios.post(`${BFF_URL}/auth/ui-session/refresh`, {}),
      ).rejects.toThrow();
      await expect(axios.post(`${BFF_URL}/auth/logout`, {})).rejects.toThrow();

      expect(mockClearAuthToken).not.toHaveBeenCalled();
      expect(mockRedirectToLogout).not.toHaveBeenCalled();
    });

    it("coalesces concurrent refresh requests", async () => {
      mockGetAuthToken
        .mockReturnValueOnce("expired")
        .mockReturnValueOnce("expired")
        .mockReturnValue("new-session-token");

      let refreshCallCount = 0;
      let retryCount = 0;
      server.use(
        http.get(`${BFF_URL}/api/data`, () => {
          retryCount++;
          if (retryCount > 1) {
            return HttpResponse.json({ result: "ok" });
          }
          return HttpResponse.json(
            { message: "Unauthorized" },
            { status: 401 },
          );
        }),
        http.get(`${BFF_URL}/api/other`, () => {
          retryCount++;
          if (retryCount > 2) {
            return HttpResponse.json({ result: "ok" });
          }
          return HttpResponse.json(
            { message: "Unauthorized" },
            { status: 401 },
          );
        }),
        http.post(`${BFF_URL}/auth/ui-session/refresh`, () => {
          refreshCallCount++;
          return HttpResponse.json({
            uiSessionToken: "new-session-token",
          });
        }),
      );

      await Promise.all([
        axios.get(`${BFF_URL}/api/data`),
        axios.get(`${BFF_URL}/api/other`),
      ]);

      expect(refreshCallCount).toBe(1);
    });
  });
});
