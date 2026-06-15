import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SecurityIcon } from "@/components/icons";

import { GdprActionItem } from "./GdprActionItem";

describe("GdprActionItem", () => {
  it("renders the label and calls onPress when clicked", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <GdprActionItem
        icon={SecurityIcon}
        label="Request data erasure"
        onPress={onPress}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Request data erasure" }),
    );

    expect(onPress).toHaveBeenCalledOnce();
  });
});
