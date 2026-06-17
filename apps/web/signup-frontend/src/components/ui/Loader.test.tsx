import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Loader } from "./Loader";

describe("Loader", () => {
  it("uses the visible label as the progressbar accessible name", () => {
    render(<Loader label="Creating your credentials..." />);

    expect(
      screen.getByRole("progressbar", {
        name: "Creating your credentials...",
      }),
    ).toBeVisible();
  });

  it("falls back to a generic accessible name without a visible label", () => {
    render(<Loader />);

    expect(screen.getByRole("progressbar", { name: "Loading" })).toBeVisible();
  });
});
