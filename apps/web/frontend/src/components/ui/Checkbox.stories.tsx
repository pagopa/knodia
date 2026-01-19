import { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "@/components/ui/Checkbox";

const meta: Meta<typeof Checkbox> = {
  args: {
    children: "Checkbox",
    isDisabled: false,
  },
  argTypes: {},
  component: Checkbox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
