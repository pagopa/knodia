import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { EserviceKeychainsEmptyState } from "./EserviceKeychainsEmptyState";

describe("EserviceKeychainsEmptyState", () => {
  it("invites administrative users to link a keychain", () => {
    renderWithProviders(<EserviceKeychainsEmptyState />, {
      roles: ["administrative"],
    });

    expect(
      screen.getByText(
        "Link a Production Keychain to sign responses from the E-Service.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a read-only message to technical users", () => {
    renderWithProviders(<EserviceKeychainsEmptyState />, {
      roles: ["technical"],
    });

    expect(
      screen.getByText(
        "There are no Keychains connected to this E-Service yet.",
      ),
    ).toBeInTheDocument();
  });
});
