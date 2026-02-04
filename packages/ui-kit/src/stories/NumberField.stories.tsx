import type { Meta, StoryObj } from "@storybook/react-vite";

import { NumberField } from "../components/ui/NumberField";
import { renderStickerSheet } from "./utils";

const meta: Meta<typeof NumberField> = {
  title: "Components/ui/NumberField",
  component: NumberField,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof NumberField>;

export const Default: Story = {
  args: {
    label: "Quantity",
    defaultValue: 5,
  },
};

export const WithDescription: Story = {
  args: {
    label: "Duration (minutes)",
    description: "Max 1440 minutes (24 hours)",
    defaultValue: 60,
  },
};

export const WithMinMax: Story = {
  args: {
    label: "Age",
    minValue: 0,
    maxValue: 120,
    defaultValue: 25,
  },
};

export const WithPlaceholder: Story = {
  args: {
    label: "Amount",
    placeholder: "Enter a number",
  },
};

export const Invalid: Story = {
  args: {
    label: "Quantity",
    defaultValue: 5,
    isInvalid: true,
    errorMessage: "Value must be greater than 10",
  },
};

export const Disabled: Story = {
  args: {
    label: "Quantity",
    defaultValue: 5,
    isDisabled: true,
  },
};

export const Required: Story = {
  args: {
    label: "Quantity",
    isRequired: true,
  },
};

export const StickerSheet: Story = {
  render: renderStickerSheet(
    [["default", "disabled", "invalid"]],
    (state) => [
      <NumberField
        defaultValue={5}
        description="Helper text"
        isDisabled={state === "disabled"}
        isInvalid={state === "invalid"}
        key={state}
        label="Label"
        {...(state === "invalid" && { errorMessage: "Error message" })}
      />,
    ],
  ),
};
