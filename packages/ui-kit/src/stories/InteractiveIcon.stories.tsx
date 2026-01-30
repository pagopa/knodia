import type { Meta, StoryObj } from "@storybook/react-vite";

import { InteractiveIcon } from "../components/ui/InteractiveIcon";
import { MockIcon, renderStickerSheet } from "./utils";

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
    children: <MockIcon />,
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
        <MockIcon />
      </InteractiveIcon>
    )),
  ),
};
