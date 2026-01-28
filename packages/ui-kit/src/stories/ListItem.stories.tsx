import type { Meta, StoryObj } from "@storybook/react-vite";

import { ListItem } from "../components/ui/ListItem";
import { MockIcon, renderStickerSheet } from "./utils";

const meta: Meta<typeof ListItem> = {
  title: "Components/ui/ListItem",
  component: ListItem,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ListItem>;

export const Default: Story = {
  render: (args) => (
    <ListItem endIcon={<MockIcon />} startIcon={<MockIcon />} {...args}>
      Label
    </ListItem>
  ),
};

export const StickerSheet: Story = {
  render: renderStickerSheet([], () => (
    <div className="flex flex-col gap-12">
      {(["normal", "selected", "disabled"] as const).map((state) => (
        <ListItem
          endIcon={<MockIcon />}
          isDisabled={state === "disabled"}
          isSelected={state === "selected"}
          startIcon={<MockIcon />}
        >
          Label
        </ListItem>
      ))}
    </div>
  )),
};
