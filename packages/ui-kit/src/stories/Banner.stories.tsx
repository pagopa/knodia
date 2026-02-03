import type { Meta, StoryObj } from "@storybook/react-vite";

import { Banner } from "../components/ui/Banner";

const meta: Meta<typeof Banner> = {
  title: "Components/ui/Banner",
  component: Banner,
  argTypes: {
    kind: {
      control: { type: "select" },
      options: ["informative", "success", "warning", "error", "neutral"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Banner>;

export const Default: Story = {
  render: (args) => <Banner {...args}>Description</Banner>,
};

export const StickerSheet: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {(["informative", "success", "warning", "error", "neutral"] as const).map(
        (kind) => (
          <Banner key={kind} kind={kind}>
            Description
          </Banner>
        ),
      )}
    </div>
  ),
};
