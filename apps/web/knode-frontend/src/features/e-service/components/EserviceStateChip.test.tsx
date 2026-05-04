import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { EserviceStateChip } from "./EserviceStateChip";

describe("EserviceStateChip", () => {
  it("renders 'Available' when state is Active", () => {
    renderWithProviders(<EserviceStateChip state="Active" />);
    expect(screen.getByText("Available")).toBeInTheDocument();
  });

  it("renders 'Unavailable' when state is Suspended", () => {
    renderWithProviders(<EserviceStateChip state="Suspended" />);
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });

  it("renders 'Archived' when state is Archived and archivedAt is not provided", () => {
    renderWithProviders(<EserviceStateChip state="Archived" />);
    expect(screen.getByText("Archived")).toBeInTheDocument();
  });

  it("renders 'Archived <date>' when state is Archived and archivedAt is provided", () => {
    renderWithProviders(
      <EserviceStateChip
        archivedAt="2026-04-30T10:00:00.000Z"
        state="Archived"
      />,
    );
    expect(screen.getByText("Archived 30.04.26")).toBeInTheDocument();
  });

  it("ignores archivedAt when state is not Archived", () => {
    renderWithProviders(
      <EserviceStateChip
        archivedAt="2026-04-30T10:00:00.000Z"
        state="Active"
      />,
    );
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.queryByText(/30\.04\.26/)).not.toBeInTheDocument();
  });
});
