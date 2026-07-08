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

vi.mock("@/contexts/auth", () => ({
  useAuthContext: () => ({
    isAuthenticated: false,
    logout: () => undefined,
    sessionToken: null,
    sessionTokenClaims: null,
  }),
}));

const { Route } = await import("./terms-and-conditions");

function renderPage() {
  const Page = Route.options.component;
  if (!Page) throw new Error("Terms & Conditions route has no component");
  return renderWithProviders(<Page />);
}

describe("Terms & Conditions page", () => {
  beforeEach(() => {
    hoisted.navigate.mockClear();
    hoisted.search = { lang: "en" };
  });

  it("renders both language tabs and the English document by default", () => {
    renderPage();

    expect(screen.getByRole("tab", { name: "English version" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Italian version" })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "BETA PROGRAMME" }),
    ).toBeVisible();
    expect(screen.queryByText("PROGRAMMA BETA")).not.toBeInTheDocument();
  });

  it("navigates the lang search param when a tab is selected", async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole("tab", { name: "Italian version" }));

    expect(hoisted.navigate).toHaveBeenCalledWith({ search: { lang: "it" } });
  });

  it("renders the Italian document when lang=it", () => {
    hoisted.search = { lang: "it" };
    renderPage();

    expect(
      screen.getByRole("heading", { name: "PROGRAMMA BETA" }),
    ).toBeVisible();
    expect(screen.queryByText("BETA PROGRAMME")).not.toBeInTheDocument();
  });
});
