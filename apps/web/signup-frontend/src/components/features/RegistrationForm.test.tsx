import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  PRIVACY_POLICY_PATH,
  TERMS_AND_CONDITIONS_PATH,
} from "@/config/legalLinks";

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

  it("links to the privacy policy and terms & conditions pages", () => {
    render(<RegistrationForm onSubmit={vi.fn()} />);

    expect(
      screen.getByRole("link", { name: "Privacy Policy" }),
    ).toHaveAttribute("href", PRIVACY_POLICY_PATH);

    const termsLinks = screen.getAllByRole("link", {
      name: "Terms & Conditions",
    });
    expect(termsLinks).toHaveLength(2);
    for (const link of termsLinks) {
      expect(link).toHaveAttribute("href", TERMS_AND_CONDITIONS_PATH);
    }
  });

  it("blocks submit and flags the required consents when unchecked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RegistrationForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Email address"), "user@mail.com");
    await user.click(
      screen.getByRole("button", { name: "Request credentials" }),
    );

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByText("Required field")).toHaveLength(2);
  });

  it("submits once the email and both consents are provided", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<RegistrationForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Email address"), "user@mail.com");
    await user.click(screen.getByRole("checkbox", { name: /I have read/ }));
    await user.click(
      screen.getByRole("checkbox", { name: /Pursuant to articles/ }),
    );
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
