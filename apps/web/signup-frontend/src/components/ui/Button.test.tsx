import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("calls onPress when clicked", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Create credentials</Button>);

    await user.click(
      screen.getByRole("button", { name: "Create credentials" }),
    );

    expect(onPress).toHaveBeenCalledOnce();
  });

  it("does not call onPress when disabled", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <Button isDisabled onPress={onPress}>
        Create credentials
      </Button>,
    );

    await user.click(
      screen.getByRole("button", { name: "Create credentials" }),
    );

    expect(onPress).not.toHaveBeenCalled();
  });
});
