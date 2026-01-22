import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar, type AvatarProps } from "./Avatar";

const sizes: NonNullable<AvatarProps["size"]>[] = ["sm", "md", "lg"];

const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const StickerSheet: Story = {
  render: () => (
    <div className="flex gap-8 justify-center items-center p-8">
      {sizes.map((size) => (
        <Avatar fallback="A" key={size} size={size} />
      ))}
    </div>
  ),
};
