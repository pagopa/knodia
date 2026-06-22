import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// config.ts validates window.env at import time, so it must be populated here.
vi.stubGlobal("env", {
  COMPANY_DETAILS_URL: "https://knodia.org/company-details",
  LEGAL_NOTES_URL: "https://knodia.org/legal-notes",
  OIDC_SESSION_FLOW_START_URL: "http://localhost:4200/auth/oidc/start",
  PRIVACY_POLICY_URL: "https://knodia.org/privacy-policy",
  SIGNUP_MANAGER_URL: "http://localhost:5176/signup-manager",
});

afterEach(() => {
  cleanup();
});
