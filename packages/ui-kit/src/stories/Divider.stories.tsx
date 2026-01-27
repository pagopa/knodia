import type { Meta, StoryObj } from "@storybook/react-vite";

import { Divider, type DividerProps } from "../components/ui/Divider";
import { renderStickerSheet } from "./utils";

const types: DividerProps["type"][] = ["dark", "light"];

const meta: Meta<typeof Divider> = {
  title: "Components/ui/Divider",
  component: Divider,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Default: Story = {
  render: (args) => (
    <div className="w-64 p-4">
      <Divider {...args} />
    </div>
  ),
};

export const StickerSheet: Story = {
  render: renderStickerSheet(
    [
      [
        "primary",
        "secondary",
        "brand",
        "informative",
        "success",
        "warning",
        "error",
      ],
    ],
    (kind) => (
      <div className="flex w-80 flex-col gap-8 p-4" key={`${kind}`}>
        {types.map((type) => (
          <Divider kind={kind} type={type} />
        ))}
      </div>
    ),
  ),
};
