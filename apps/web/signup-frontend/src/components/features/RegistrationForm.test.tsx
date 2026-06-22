import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RegistrationForm } from "./RegistrationForm";

describe("RegistrationForm", () => {
  it("disables the submit button until a valid email is entered", async () => {
    const user = userEvent.setup();
    render(<RegistrationForm onSubmit={vi.fn()} />);

    const submit = screen.getByRole("button", { name: "Request credentials" });
    expect(submit).toBeDisabled();

    const input = screen.getByLabelText("Email address");
    await user.type(input, "not-an-email");
    expect(submit).toBeDisabled();

    await user.clear(input);
    await user.type(input, "user@mail.com");
    expect(submit).toBeEnabled();
  });

  it("submits the entered email", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RegistrationForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Email address"), "user@mail.com");
    await user.click(
      screen.getByRole("button", { name: "Request credentials" }),
    );

    expect(onSubmit).toHaveBeenCalledWith("user@mail.com");
  });

  it("shows the error message", () => {
    render(
      <RegistrationForm
        errorMessage="Email already in use"
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText("Email already in use")).toBeInTheDocument();
  });
});
