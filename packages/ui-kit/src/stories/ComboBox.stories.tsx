import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { ComboBox, ComboBoxItem } from "../components/ui/ComboBox";

const meta: Meta<typeof ComboBox> = {
  title: "Components/ui/ComboBox",
  component: ComboBox,
  parameters: {
    layout: "centered",
  },
  args: {
    className: "w-80",
  },
};

export default meta;
type Story = StoryObj<typeof ComboBox>;

const items = Array.from({ length: 6 }, (_, i) => `Item ${i + 1}`);
const children = items.map((item) => (
  <ComboBoxItem id={item} key={item}>
    {item}
  </ComboBoxItem>
));

export const Default: Story = {
  args: {
    label: "Label",
    size: "md",
    placeholder: "Placeholder ...",
    children,
  },
};

export const WithDescription: Story = {
  args: {
    label: "Label",
    size: "md",
    placeholder: "Placeholder ...",
    description: "This is a description",
    children,
  },
};

export const Invalid: Story = {
  args: {
    label: "Label",
    size: "md",
    placeholder: "Placeholder ...",
    isInvalid: true,
    errorMessage: "This field is required",
    children,
  },
};

export const Clearable: Story = {
  render: () => {
    const [inputValue, setInputValue] = useState("");

    return (
      <ComboBox
        className="w-80"
        inputValue={inputValue}
        isClearable
        label="Label"
        onInputChange={setInputValue}
        placeholder="Type to search..."
        size="md"
      >
        {children}
      </ComboBox>
    );
  },
};

export const Disabled: Story = {
  args: {
    label: "Label",
    size: "md",
    placeholder: "Placeholder ...",
    isDisabled: true,
    children,
  },
};
