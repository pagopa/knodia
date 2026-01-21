import { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "@/components/ui/Badge";

const meta: Meta<typeof Badge> = {
  component: Badge,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md"],
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "destructive", "quiet"],
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  args: {
    children: "Badge",
    size: "sm",
    variant: "secondary",
  },
};
