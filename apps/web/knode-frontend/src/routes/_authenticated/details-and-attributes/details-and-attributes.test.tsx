import { Suspense } from "react";
import { describe, expect, it } from "vitest";

import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { DetailsAndAttributesPage } from "./index";

describe("DetailsAndAttributesPage", () => {
  it("renders the page title and organization ID", async () => {
    renderWithProviders(
      <Suspense>
        <DetailsAndAttributesPage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByText("Details and attributes")).toBeInTheDocument();
    });

    expect(
      screen.getByText("#20000000-2000-1000-8000-000000000002"),
    ).toBeInTheDocument();
  });

  it("renders the Contacts section with mocked data", async () => {
    renderWithProviders(
      <Suspense>
        <DetailsAndAttributesPage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByText("Contacts")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("E-mail address")).toHaveValue("-");
    expect(screen.getByLabelText("Notes")).toHaveValue("-");
  });

  it("renders the Attributes section with resolved attribute names", async () => {
    renderWithProviders(
      <Suspense>
        <DetailsAndAttributesPage />
      </Suspense>,
    );

    await waitFor(() => {
      expect(screen.getByText("Attributes")).toBeInTheDocument();
    });

    expect(screen.getByText("NUTS 3")).toBeInTheDocument();
  });
});
