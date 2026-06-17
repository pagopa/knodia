import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Radio, RadioGroup } from "./RadioGroup";

function GdprReasons() {
  return (
    <RadioGroup aria-label="Reason" label="Please select a reason.">
      <Radio value="a">I believe my data is inaccurate (Art. 18.1.a)</Radio>
      <Radio value="b">My data was processed unlawfully (Art. 18.1.b)</Radio>
    </RadioGroup>
  );
}

describe("RadioGroup", () => {
  it("selects a radio on click", async () => {
    const user = userEvent.setup();
    render(<GdprReasons />);

    const first = screen.getByRole("radio", {
      name: "I believe my data is inaccurate (Art. 18.1.a)",
    });
    await user.click(first);

    expect(first).toBeChecked();
  });

  it("moves the selection with the keyboard arrows", async () => {
    const user = userEvent.setup();
    render(<GdprReasons />);

    const first = screen.getByRole("radio", {
      name: "I believe my data is inaccurate (Art. 18.1.a)",
    });
    const second = screen.getByRole("radio", {
      name: "My data was processed unlawfully (Art. 18.1.b)",
    });
    await user.click(first);
    await user.keyboard("{ArrowDown}");

    expect(second).toBeChecked();
  });
});
