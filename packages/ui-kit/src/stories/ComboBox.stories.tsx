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

// Controlled filtering (like the real server-filtered usages): the parent owns
// `items`, so an unmatched query yields an empty list and the empty state shows.
export const NoResults: Story = {
  render: () => {
    const [inputValue, setInputValue] = useState("no match");
    const filtered = items.filter((item) =>
      item.toLowerCase().includes(inputValue.toLowerCase()),
    );

    return (
      <ComboBox<{ id: string }>
        className="w-80"
        inputValue={inputValue}
        items={filtered.map((item) => ({ id: item }))}
        label="Label"
        menuTrigger="focus"
        onInputChange={setInputValue}
        placeholder="Type to search..."
      >
        {(item) => <ComboBoxItem id={item.id}>{item.id}</ComboBoxItem>}
      </ComboBox>
    );
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
