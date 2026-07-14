import { render, screen } from "@testing-library/react";
import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it, vi } from "vitest";

import { ErrorPage } from "./ErrorPage";

describe("ErrorPage", () => {
  it("renders the generic error copy", () => {
    render(<ErrorPage error={new Error("boom")} reset={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Something went wrong" }),
    ).toBeVisible();
    expect(screen.getByText("Please try again later.")).toBeVisible();
  });

  it("shows the HTTP status of an AxiosError as the error code", () => {
    const error = new AxiosError(
      "fail",
      "ERR_BAD_RESPONSE",
      undefined,
      undefined,
      { status: 503 } as AxiosResponse,
    );

    render(<ErrorPage error={error} reset={vi.fn()} />);

    expect(screen.getByText("Error code: 503")).toBeVisible();
  });

  it("falls back to Unknown when the error carries no HTTP status", () => {
    render(<ErrorPage error={new Error("network down")} reset={vi.fn()} />);

    expect(screen.getByText("Error code: Unknown")).toBeVisible();
  });
});
