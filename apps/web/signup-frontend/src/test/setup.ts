import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

window.env = {
  KNODIA_ORG_URL: "https://knodia.org/",
  LYNX_PROTOTYPE_URL: "http://localhost:5002/ui",
  OIDC_SESSION_FLOW_START_URL: "/oidc/login",
  ORION_PROTOTYPE_URL: "http://localhost:5001/ui",
  SIGNUP_MANAGER_URL: "/signup-manager",
};

afterEach(() => {
  cleanup();
});
