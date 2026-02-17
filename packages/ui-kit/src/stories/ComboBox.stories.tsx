import type { Meta, StoryObj } from "@storybook/react-vite";

import { useState } from "react";

import { ComboBox, ComboBoxItem } from "../components/ui/ComboBox";

const items = Array.from({ length: 6 }, (_, i) => `Item ${i + 1}`);
const children = items.map((item) => (
  <ComboBoxItem id={item} key={item}>
    {item}
  </ComboBoxItem>
));

const meta: Meta<typeof ComboBox> = {
  title: "Components/ui/ComboBox",
  component: ComboBox,
  parameters: {
    layout: "centered",
  },
  args: {
    className: "w-80",
    label: "Label",
    size: "md",
    placeholder: "Type to search...",
    children,
  },
};

export default meta;
type Story = StoryObj<typeof ComboBox>;

export const Default: Story = {};

export const WithDescription: Story = {
  args: {
    description: "This is a description",
  },
};

export const Invalid: Story = {
  args: {
    isInvalid: true,
    errorMessage: "This field is required",
  },
};

export const Clearable: Story = {
  render: (args) => {
    const [inputValue, setInputValue] = useState("");

    return (
      <ComboBox
        {...args}
        inputValue={inputValue}
        isClearable
        onInputChange={setInputValue}
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4 w-80">
      <ComboBox {...args} label="Small" size="sm" />
      <ComboBox {...args} label="Medium" size="md" />
      <ComboBox {...args} label="Large" size="lg" />
    </div>
  ),
};
