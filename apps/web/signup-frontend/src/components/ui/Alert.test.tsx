import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Alert } from "./Alert";

describe("Alert", () => {
  it("renders its content", () => {
    render(<Alert>Heads up, this is permanent.</Alert>);

    expect(screen.getByText("Heads up, this is permanent.")).toBeVisible();
  });

  it("exposes the error severity as an alert role", () => {
    render(<Alert severity="error">Something went wrong.</Alert>);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Something went wrong.",
    );
  });
});
