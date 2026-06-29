import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./msw/server";

window.env = {
  KNODIA_ORG_COMPANY_DETAILS_URL: "https://knodia.org/company-details",
  KNODIA_ORG_URL: "https://knodia.org/",
  OIDC_SESSION_FLOW_START_URL: "/oidc/login",
  SIGNUP_MANAGER_URL: "/signup-manager",
};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
