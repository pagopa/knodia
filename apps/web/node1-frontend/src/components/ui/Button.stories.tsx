import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "@/components/ui/Button";

const meta: Meta<typeof Button> = {
  args: {
    children: "Button",
    isDisabled: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "destructive", "quiet"],
    },
  },
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
  },
};

export const Quiet: Story = {
  args: {
    variant: "quiet",
  },
};
