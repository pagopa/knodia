import type { Meta, StoryObj } from "@storybook/react-vite";

import { Steps } from "../components/ui/Steps";

const meta: Meta<typeof Steps> = {
  title: "Components/ui/Steps",
  component: Steps,
};

export default meta;
type Story = StoryObj<typeof Steps>;

const steps: string[] = ["Step 1", "Step 2", "Step 3", "Step 4", "Step 5"];

export const Default: Story = {
  render: (args) => (
    <div className="w-full p-12 flex flex-col gap-12">
      <Steps {...args} current={0} steps={steps} />
      <Steps {...args} current={1} steps={steps} />
      <Steps {...args} current={2} steps={steps} />
      <Steps {...args} current={3} steps={steps} />
      <Steps {...args} current={4} isCurrentInvalid steps={steps} />
    </div>
  ),
};
