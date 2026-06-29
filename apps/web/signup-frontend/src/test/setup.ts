import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./msw/server";

window.env = {
  KNODIA_ORG_URL: "https://knodia.org/",
  LYNX_PROTOTYPE_URL: "http://localhost:5002/ui",
  OIDC_SESSION_FLOW_START_URL: "/oidc/login",
  ORION_PROTOTYPE_URL: "http://localhost:5001/ui",
  SIGNUP_MANAGER_URL: "/signup-manager",
};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
