import type { Meta, StoryObj } from "@storybook/react-vite";

import { Select, SelectItem, type SelectProps } from "../components/ui/Select";
import { renderStickerSheet } from "./utils";

const sizes: NonNullable<SelectProps<unknown[]>["size"]>[] = ["sm", "md", "lg"];

const meta: Meta<typeof Select> = {
  title: "Components/ui/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  args: {
    className: "w-80",
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

const items = Array.from({ length: 6 }, (_, i) => `Item ${i + 1}`);
const children = items.map((item) => (
  <SelectItem id={item} key={item}>
    {item}
  </SelectItem>
));

export const Default: Story = {
  args: {
    label: "Label",
    size: "md",
    children,
  },
};

export const WithDescription: Story = {
  args: {
    label: "Label",
    size: "md",
    description: "Hint message",
    children,
  },
};

export const Invalid: Story = {
  args: {
    label: "Label",
    size: "md",
    isInvalid: true,
    errorMessage: "This is an error message",
    children,
  },
};

export const Multiple: Story = {
  args: {
    label: "Label",
    size: "md",
    selectionMode: "multiple",
    children,
  },
};

export const MultipleWithDescription: Story = {
  args: {
    label: "Label",
    size: "md",
    selectionMode: "multiple",
    description: "Hint message",
    children,
  },
};

export const MultipleInvalid: Story = {
  args: {
    label: "Label",
    size: "md",
    selectionMode: "multiple",
    isInvalid: true,
    errorMessage: "This is an error message",
    children,
  },
};

export const StickerSheet: Story = {
  render: renderStickerSheet([["default", "disabled", "invalid"]], (state) =>
    sizes.map((size) => (
      <Select
        className="w-48"
        isDisabled={state === "disabled"}
        isInvalid={state === "invalid"}
        key={`${size}-${state}`}
        label="Label"
        size={size}
      >
        {children}
      </Select>
    )),
  ),
};

export const MultipleStickerSheet: Story = {
  render: renderStickerSheet([["default", "disabled", "invalid"]], (state) =>
    sizes.map((size) => (
      <Select
        className="w-48"
        isDisabled={state === "disabled"}
        isInvalid={state === "invalid"}
        key={`${size}-${state}`}
        label="Label"
        selectionMode="multiple"
        size={size}
      >
        {children}
      </Select>
    )),
  ),
};
