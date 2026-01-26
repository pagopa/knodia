import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar, type AvatarProps } from "../components/ui/Avatar";
import { renderStickerSheet } from "./utils";

const sizes: NonNullable<AvatarProps["size"]>[] = ["sm", "md", "lg"];

const meta: Meta<typeof Avatar> = {
  title: "Components/ui/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    fallback: "A",
  },
};

export const StickerSheet: Story = {
  render: renderStickerSheet([["default"]], () =>
    sizes.map((size) => <Avatar fallback="A" key={size} size={size} />),
  ),
};
