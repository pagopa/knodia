import { Meta, StoryObj } from "@storybook/react-vite";
import { HelpCircle } from "lucide-react";
import { DialogTrigger, Heading } from "react-aria-components";

import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Popover } from "@/components/ui/Popover";

const meta: Meta<typeof Popover> = {
  component: Popover,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    showArrow: true,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Example: Story = {
  render: (args) => (
    <DialogTrigger>
      <Button aria-label="Help" variant="secondary">
        <HelpCircle className="w-4 h-4" />
      </Button>
      <Popover {...args} className="max-w-62.5">
        <Dialog>
          <Heading className="text-lg font-semibold mb-2" slot="title">
            Help
          </Heading>
          <p className="text-sm">
            For help accessing your account, please contact support.
          </p>
        </Dialog>
      </Popover>
    </DialogTrigger>
  ),
};
