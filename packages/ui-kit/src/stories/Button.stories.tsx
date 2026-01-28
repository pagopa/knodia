import type { Meta, StoryObj } from "@storybook/react-vite";

import { PlaceholderIcon } from "@phosphor-icons/react";

import { Button, type ButtonProps } from "../components/ui/Button";
import { renderStickerSheet } from "./utils";

const sizes: NonNullable<ButtonProps["size"]>[] = ["sm", "md", "lg"];
const states = ["default", "disabled"] as const;

const meta: Meta<typeof Button> = {
  title: "Components/ui/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: "Button",
  },
};

export const StickerSheet: Story = {
  render: renderStickerSheet(
    [
      ["filled", "outlined", "ghost", "tonal", "elevated"],
      ["neutral", "brand", "danger"],
    ],
    (kind, hierarchy) =>
      states.map((state) =>
        sizes.map((size) => (
          <Button
            hierarchy={hierarchy}
            isDisabled={state === "disabled"}
            key={`${hierarchy}-${kind}-${state}-${size}`}
            kind={kind}
            size={size}
          >
            <PlaceholderIcon />
            Button
            <PlaceholderIcon />
          </Button>
        )),
      ),
  ),
};
