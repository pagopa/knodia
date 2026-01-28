import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "../components/ui/Checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Components/ui/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  render: (args) => (
    <Checkbox {...args} description="Description">
      Checkbox Label
    </Checkbox>
  ),
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};

export const Disabled: Story = {
  args: {
    isDisabled: true,
  },
};

export const Indeterminate: Story = {
  args: {
    isIndeterminate: true,
  },
};
