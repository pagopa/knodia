import { describe, expect, it } from "vitest";

import { renderWithProviders, screen, waitFor } from "@/test/utils";

import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("renders the organization name from the session", async () => {
    renderWithProviders(<Sidebar />);

    await waitFor(() => {
      expect(screen.getByText("Test Organization")).toBeInTheDocument();
    });
  });

  it("renders sidebar navigation sections", () => {
    renderWithProviders(<Sidebar />);

    expect(screen.getByText("Details and attributes")).toBeInTheDocument();
    expect(screen.getByText("Operators")).toBeInTheDocument();
    expect(screen.getByText("Keychains")).toBeInTheDocument();
    expect(screen.getAllByText("E-Services")).toHaveLength(2);
    expect(screen.getAllByText("Agreements")).toHaveLength(2);
    expect(screen.getAllByText("Purposes")).toHaveLength(2);
  });

  it("renders the legal links pointing at the configured URLs", () => {
    renderWithProviders(<Sidebar />);

    const privacyLink = screen.getByRole("link", { name: "Privacy Policy" });
    expect(privacyLink).toHaveAttribute(
      "href",
      "http://localhost:5176/ui/privacy-policy",
    );
    expect(privacyLink).toHaveAttribute("target", "_blank");
    expect(privacyLink).toHaveAttribute("rel", "noopener noreferrer");

    expect(
      screen.getByRole("link", { name: "Terms and Conditions" }),
    ).toHaveAttribute("href", "http://localhost:5176/ui/terms-and-conditions");

    expect(screen.getByRole("navigation", { name: "Legal" })).toHaveTextContent(
      "Privacy Policy·Terms and Conditions",
    );
  });
});
