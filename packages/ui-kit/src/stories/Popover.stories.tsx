import type { Meta, StoryObj } from "@storybook/react-vite";

import { DialogTrigger } from "react-aria-components";

import { Button } from "../components/ui/Button";
import { Popover } from "../components/ui/Popover";

const meta: Meta<typeof Popover> = {
  args: {
    title: "Popover Title",
    placement: "bottom",
  },
  title: "Components/ui/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: (args) => (
    <DialogTrigger>
      <Button>Open Popover</Button>
      <Popover {...args}>
        <p className="body-sm">
          This is a popover with some informational content. Click the close
          button or press Escape to dismiss.
        </p>
      </Popover>
    </DialogTrigger>
  ),
};
