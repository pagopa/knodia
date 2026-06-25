import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "./msw/server";

// config.ts validates window.env at module load, so it must exist before any
// module that imports the config (e.g. the axios client) is evaluated.
vi.stubGlobal("env", {
  KNODIA_ORG_URL: "https://knodia.org/",
  OIDC_SESSION_FLOW_START_URL: "http://localhost:4200/auth/oidc/start",
  SIGNUP_MANAGER_URL: "http://localhost:5176/signup-manager",
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
