import { Meta, StoryObj } from "@storybook/react-vite";

import { Switch } from "@/components/ui/Switch";

const meta: Meta<typeof Switch> = {
  component: Switch,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => <Switch {...args}>Wi-Fi</Switch>,
};
