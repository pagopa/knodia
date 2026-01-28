import type { Meta, StoryObj } from "@storybook/react-vite";

import { PlaceholderIcon } from "@phosphor-icons/react";
import { X } from "lucide-react";

import { Chip, type ChipProps } from "../components/ui/Chip";
import { renderStickerSheet } from "./utils";

const meta: Meta<typeof Chip> = {
  title: "Components/ui/Chip",
  component: Chip,
  parameters: {
    layout: "centered",
  },
};

const types: ChipProps["type"][] = ["bright", "dark", "light"];

export default meta;
type Story = StoryObj<typeof Chip>;

export const Default: Story = {
  args: {
    label: "Label",
  },
};

export const WithIcon: Story = {
  args: {
    label: "Label",
    icon: <PlaceholderIcon />,
  },
};

export const StickerSheet: Story = {
  render: renderStickerSheet(
    [["neutral", "brand", "informative", "success", "warning", "error"]],
    (kind) =>
      types.map((type) => (
        <Chip
          icon={<X />}
          key={`${kind}-${type}`}
          kind={kind}
          label="Label"
          type={type}
        />
      )),
  ),
};
