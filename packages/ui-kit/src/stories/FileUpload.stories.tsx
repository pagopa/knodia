import type { Meta, StoryObj } from "@storybook/react-vite";

import { FileUpload } from "../components/ui/FileUpload";

const meta: Meta<typeof FileUpload> = {
  title: "Components/ui/FileUpload",
  component: FileUpload,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof FileUpload>;

export const Default: Story = {
  args: {},
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
  },
};
