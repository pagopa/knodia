import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it, vi } from "vitest";

import { AuthContextProvider } from "@/contexts/auth";

import { ErrorPage } from "./ErrorPage";

// ErrorPage wraps PageLayout, whose Header needs both the auth context and a
// router (Link to="/home"), so we mount it through a memory router the same way
// the app router renders it as defaultErrorComponent.
function renderErrorPage(error: Error) {
  const rootRoute = createRootRoute({
    component: () => <ErrorPage error={error} reset={vi.fn()} />,
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: rootRoute,
  });

  return render(
    <AuthContextProvider>
      <RouterProvider router={router} />
    </AuthContextProvider>,
  );
}

describe("ErrorPage", () => {
  it("renders the generic error copy", async () => {
    renderErrorPage(new Error("boom"));

    expect(
      await screen.findByRole("heading", { name: "Something went wrong" }),
    ).toBeVisible();
    expect(screen.getByText("Please try again later.")).toBeVisible();
  });

  it("shows the HTTP status of an AxiosError as the error code", async () => {
    const error = new AxiosError(
      "fail",
      "ERR_BAD_RESPONSE",
      undefined,
      undefined,
      { status: 503 } as AxiosResponse,
    );

    renderErrorPage(error);

    expect(await screen.findByText("Error code: 503")).toBeVisible();
  });

  it("falls back to Unknown when the error carries no HTTP status", async () => {
    renderErrorPage(new Error("network down"));

    expect(await screen.findByText("Error code: Unknown")).toBeVisible();
  });
});
