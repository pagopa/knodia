import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button, TooltipTrigger } from "react-aria-components";

import { Tooltip } from "../components/ui/Tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Components/ui/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: (args) => (
    <TooltipTrigger isOpen>
      <Button>Test Tooltip</Button>
      <Tooltip isOpen {...args}>
        Description
      </Tooltip>
    </TooltipTrigger>
  ),
};

export const Example: Story = {
  render: (args) => (
    <TooltipTrigger>
      <Button>Hover me</Button>
      <Tooltip {...args}>Description</Tooltip>
    </TooltipTrigger>
  ),
};
