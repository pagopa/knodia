import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

window.env = {
  KNODIA_ORG_URL: "https://knodia.org/",
  OIDC_SESSION_FLOW_START_URL: "/oidc/login",
  SIGNUP_MANAGER_URL: "/signup-manager",
};

afterEach(() => {
  cleanup();
});
