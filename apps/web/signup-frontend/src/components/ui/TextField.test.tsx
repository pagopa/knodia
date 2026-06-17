import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TextField } from "./TextField";

describe("TextField", () => {
  it("associates the label with the input", async () => {
    const user = userEvent.setup();
    render(<TextField label="Email address" />);

    const input = screen.getByLabelText("Email address");
    await user.type(input, "user@mail.com");

    expect(input).toHaveValue("user@mail.com");
  });

  it("shows the error message and marks the input as invalid", () => {
    render(
      <TextField
        errorMessage="Email address already in use"
        label="Email address"
      />,
    );

    expect(screen.getByLabelText("Email address")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByText("Email address already in use")).toBeVisible();
  });

  it("does not render an error when there is no error message", () => {
    render(<TextField label="Email address" />);

    expect(
      screen.queryByText("Email address already in use"),
    ).not.toBeInTheDocument();
  });
});
