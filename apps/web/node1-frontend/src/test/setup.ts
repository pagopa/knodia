import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

vi.stubGlobal("env", {
  BFF_URL: import.meta.env["BFF_URL"],
  COGNITO_AUTHORITY: "http://localhost:9229",
  COGNITO_CLIENT_ID: "test-client-id",
  COGNITO_DOMAIN: "http://localhost:9229",
  COGNITO_LOGOUT_URI: "http://localhost:5173/auth/callback",
  COGNITO_REDIRECT_URI: "http://localhost:5173/auth/callback",
});

import { server } from "./msw/server";

// Polyfill File.arrayBuffer() for jsdom (not natively supported)
if (typeof File.prototype.arrayBuffer !== "function") {
  File.prototype.arrayBuffer = function () {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.readAsArrayBuffer(this);
    });
  };
}

afterEach(() => {
  cleanup();
});

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
