import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearAuthToken,
  getAuthToken,
  redirectToLogout,
  setAuthToken,
} from "@/test/mocks/auth";
import { server } from "@/test/msw/server";

vi.mock("@/libs/auth", () => import("@/test/mocks/auth"));

const BFF_URL = import.meta.env["BFF_URL"];

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
    getAuthToken.mockReturnValue(null);
  });

  describe("request interceptor (addAuthHeader)", () => {
    it("adds Authorization header when token is present", async () => {
      getAuthToken.mockReturnValue("my-token");

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

  describe("Content-Type defaults", () => {
    it("does not send default Content-Type on POST with empty body", async () => {
      let capturedContentType: null | string = "initial";
      server.use(
        http.post(`${BFF_URL}/api/action`, ({ request }) => {
          capturedContentType = request.headers.get("Content-Type");
          return HttpResponse.json({ ok: true });
        }),
      );

      await axios.post(`${BFF_URL}/api/action`);

      expect(capturedContentType).toBeNull();
    });

    it("does not send default Content-Type on PATCH with empty body", async () => {
      let capturedContentType: null | string = "initial";
      server.use(
        http.patch(`${BFF_URL}/api/resource/1`, ({ request }) => {
          capturedContentType = request.headers.get("Content-Type");
          return HttpResponse.json({ ok: true });
        }),
      );

      await axios.patch(`${BFF_URL}/api/resource/1`);

      expect(capturedContentType).toBeNull();
    });
  });

  describe("response interceptor (handleUnauthorized)", () => {
    it("retries with new token after successful refresh", async () => {
      getAuthToken
        .mockReturnValueOnce("expired-token")
        .mockReturnValue("new-session-token");

      setupProtectedEndpoint([{ status: 401 }, { status: 200 }]);
      setupRefreshEndpoint(true);

      const response = await axios.get(`${BFF_URL}/api/data`);

      expect(response.data).toEqual({ result: "ok" });
      expect(setAuthToken).toHaveBeenCalledWith("new-session-token");
    });

    it("clears token and redirects to logout when refresh fails", async () => {
      getAuthToken.mockReturnValue("expired-token");

      setupProtectedEndpoint([{ status: 401 }]);
      setupRefreshEndpoint(false);

      await expect(axios.get(`${BFF_URL}/api/data`)).rejects.toThrow();

      expect(clearAuthToken).toHaveBeenCalledOnce();
      expect(redirectToLogout).toHaveBeenCalledOnce();
    });

    it("does not intercept non-401 errors", async () => {
      server.use(
        http.get(`${BFF_URL}/api/data`, () =>
          HttpResponse.json({ message: "Server error" }, { status: 500 }),
        ),
      );

      await expect(axios.get(`${BFF_URL}/api/data`)).rejects.toThrow();

      expect(clearAuthToken).not.toHaveBeenCalled();
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

      expect(clearAuthToken).not.toHaveBeenCalled();
      expect(redirectToLogout).not.toHaveBeenCalled();
    });

    it("coalesces concurrent refresh requests", async () => {
      getAuthToken
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
