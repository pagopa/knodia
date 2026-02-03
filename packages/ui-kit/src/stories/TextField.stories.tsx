import type { Meta, StoryObj } from "@storybook/react-vite";

import { PlaceholderIcon } from "@phosphor-icons/react";

import { TextField, type TextFieldProps } from "../components/ui/TextField";
import { renderStickerSheet } from "./utils";

const sizes: NonNullable<TextFieldProps["size"]>[] = ["sm", "md", "lg"];

const meta: Meta<typeof TextField> = {
  title: "Components/ui/TextField",
  component: TextField,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Default: Story = {
  args: {
    label: "Label",
    size: "md",
    value: "Value",
  },
};

export const WithDescription: Story = {
  args: {
    label: "Label",
    size: "md",
    value: "Value",
    description: "Hint message",
  },
};

export const WithIcon: Story = {
  args: {
    label: "Label",
    size: "md",
    value: "Value",
    endIcon: <PlaceholderIcon />,
  },
};

export const Invalid: Story = {
  args: {
    label: "Label",
    size: "md",
    value: "Value",
    isInvalid: true,
    errorMessage: "This is an error message",
  },
};

export const StickerSheet: Story = {
  render: renderStickerSheet(
    [["default", "disabled", "invalid", "readonly"]],
    (state) =>
      sizes.map((size) => (
        <TextField
          endIcon={<PlaceholderIcon />}
          isDisabled={state === "disabled"}
          isInvalid={state === "invalid"}
          isReadOnly={state === "readonly"}
          key={`${size}-${state}`}
          label={"Label"}
          size={size}
          value="Value"
        />
      )),
  ),
};
