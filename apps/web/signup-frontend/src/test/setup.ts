import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// config.ts validates window.env at import time, so it must be populated here.
vi.stubGlobal("env", {
  KNODIA_ORG_URL: "https://knodia.org/",
  OIDC_SESSION_FLOW_START_URL: "http://localhost:4200/auth/oidc/start",
  SIGNUP_MANAGER_URL: "http://localhost:5176/signup-manager",
});

afterEach(() => {
  cleanup();
});
