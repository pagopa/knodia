import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// config.ts validates window.env at import time, so it must be populated here.
window.env = {
  KNODIA_ORG_COMPANY_DETAILS_URL: "https://knodia.org/company-details",
  KNODIA_ORG_LEGAL_NOTES_URL: "https://knodia.org/legal-notes",
  KNODIA_ORG_URL: "https://knodia.org/",
  OIDC_SESSION_FLOW_START_URL: "/oidc/login",
  SIGNUP_MANAGER_URL: "/signup-manager",
};

afterEach(() => {
  cleanup();
});
