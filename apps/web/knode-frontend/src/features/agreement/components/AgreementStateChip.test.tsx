import { describe, expect, it } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

import { AgreementStateChip } from "./AgreementStateChip";

describe("AgreementStateChip", () => {
  it("renders 'Active' when state is Active", () => {
    renderWithProviders(<AgreementStateChip state="Active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders 'Suspended' when state is Suspended", () => {
    renderWithProviders(<AgreementStateChip state="Suspended" />);
    expect(screen.getByText("Suspended")).toBeInTheDocument();
  });

  it("renders 'Archived' when state is Archived", () => {
    renderWithProviders(<AgreementStateChip state="Archived" />);
    expect(screen.getByText("Archived")).toBeInTheDocument();
  });
});
