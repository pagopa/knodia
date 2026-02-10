import type { Meta, StoryObj } from "@storybook/react-vite";

import { Loader } from "../components/ui/Loader";

const meta: Meta<typeof Loader> = {
  title: "Components/ui/Loader",
  component: Loader,
  argTypes: {
    size: {
      control: { type: "number" },
    },
    isIndeterminate: {
      control: { type: "boolean" },
    },
    value: {
      control: { type: "number" },
    },
  },
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Loader>;

export const Default: Story = {
  args: {
    isIndeterminate: true,
  },
};

export const Determinate: Story = {
  args: {
    isIndeterminate: false,
    value: 65,
  },
};
