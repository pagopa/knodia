import type { Meta, StoryObj } from "@storybook/react-vite";

import { PlaceholderIcon } from "@phosphor-icons/react";

import { InteractiveIcon } from "../components/ui/InteractiveIcon";
import { renderStickerSheet } from "./utils";

const states = ["default", "disabled"] as const;

const meta: Meta<typeof InteractiveIcon> = {
  title: "Components/ui/InteractiveIcon",
  component: InteractiveIcon,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof InteractiveIcon>;

export const Default: Story = {
  args: {
    children: <PlaceholderIcon />,
  },
};

export const StickerSheet: Story = {
  render: renderStickerSheet([["neutral", "brand", "danger"]], (hierarchy) =>
    states.map((state) => (
      <InteractiveIcon
        hierarchy={hierarchy}
        isDisabled={state === "disabled"}
        key={`${hierarchy}-${state}`}
      >
        <PlaceholderIcon />
      </InteractiveIcon>
    )),
  ),
};
