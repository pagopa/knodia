import type { Meta, StoryObj } from "@storybook/react-vite";

import { CopyButton } from "../components/ui/CopyButton";
import { renderStickerSheet } from "./utils";

const states = ["default", "disabled"] as const;

const meta: Meta<typeof CopyButton> = {
  title: "Components/ui/CopyButton",
  component: CopyButton,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof CopyButton>;

export const Default: Story = {
  args: {
    textToCopy: "Hello, World!",
  },
};

export const CustomTooltip: Story = {
  args: {
    textToCopy: "custom-id-12345",
    copiedTooltipText: "ID copied!",
  },
};

export const StickerSheet: Story = {
  render: renderStickerSheet(
    [["neutral", "brand", "danger", "inverse"]],
    (hierarchy) =>
      states.map((state) => (
        <CopyButton
          hierarchy={hierarchy}
          isDisabled={state === "disabled"}
          key={`${hierarchy}-${state}`}
          textToCopy="Sample text"
        />
      )),
  ),
};
