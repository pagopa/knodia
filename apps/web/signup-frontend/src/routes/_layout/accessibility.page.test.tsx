import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders, screen } from "@/test/utils";

// Mock the file Route to drive the selected language and assert tabs navigate `lang`.
const hoisted = vi.hoisted(() => ({
  navigate: vi.fn(),
  search: { lang: "en" as "en" | "it" },
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({
    options,
    useNavigate: () => hoisted.navigate,
    useSearch: () => hoisted.search,
  }),
  createLink: (component: React.ComponentType) => component,
}));

const { Route } = await import("./accessibility");

function renderPage() {
  const Page = Route.options.component;
  if (!Page) throw new Error("Accessibility route has no component");
  return renderWithProviders(<Page />);
}

describe("Accessibility page", () => {
  beforeEach(() => {
    hoisted.navigate.mockClear();
    hoisted.search = { lang: "en" };
  });

  it("renders both language tabs and the English document by default", () => {
    renderPage();

    expect(screen.getByRole("tab", { name: "English version" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Italian version" })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Accessibility Statement" }),
    ).toBeVisible();
    expect(
      screen.queryByText("Dichiarazione di accessibilità"),
    ).not.toBeInTheDocument();
  });

  it("navigates the lang search param when a tab is selected", async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole("tab", { name: "Italian version" }));

    expect(hoisted.navigate).toHaveBeenCalledWith({ search: { lang: "it" } });
  });

  it("renders the Italian document with the AgID external link when lang=it", () => {
    hoisted.search = { lang: "it" };
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Dichiarazione di accessibilità" }),
    ).toBeVisible();
    expect(
      screen.queryByText("Accessibility Statement"),
    ).not.toBeInTheDocument();

    const agidLink = screen.getByRole("link", {
      name: /Leggi la dichiarazione di accessibilità/,
    });
    expect(agidLink).toHaveAttribute(
      "href",
      "https://form.agid.gov.it/5N2TR557/Knodia_(service_prototype)/dichiarazione",
    );
    expect(agidLink).toHaveAttribute("target", "_blank");
  });
});
