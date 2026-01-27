import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextArea, type TextAreaProps } from "../components/ui/TextArea";
import { renderStickerSheet } from "./utils";

const sizes: NonNullable<TextAreaProps["size"]>[] = ["sm", "md", "lg"];

const meta: Meta<typeof TextArea> = {
  title: "Components/ui/TextArea",
  component: TextArea,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof TextArea>;

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
        <TextArea
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
